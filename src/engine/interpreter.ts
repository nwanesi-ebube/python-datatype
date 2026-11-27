import {
  EngineStepYield,
  TraceStep,
  TraceVariable,
} from '../types/lab';
import { ExprNode, parsePython, StmtNode, TargetNode } from './parser';
import { PYTHON_BUILTINS, translatePythonError } from './pythonMeta';
import {
  formatWithSpec,
  MemoryHeap,
  PyBuiltinVal,
  PyComplexVal,
  PyError,
  PyFunctionVal,
  PyModuleVal,
  PyObj,
  PyRangeVal,
  pyBool,
  pyEquals,
  pyHashKey,
  pyRepr,
  pyStr,
  rangeLength,
  rangeToArray,
} from './pyValues';

const MAX_STEPS = 2000;

class ControlSignal {
  kind: 'break' | 'continue' | 'return';
  value?: PyObj;
  constructor(kind: 'break' | 'continue' | 'return', value?: PyObj) {
    this.kind = kind;
    this.value = value;
  }
}

type EvalGen = Generator<EngineStepYield, PyObj, string | undefined>;
type StmtGen = Generator<EngineStepYield, ControlSignal | void, string | undefined>;

export function* executePythonGenerator(source: string): Generator<EngineStepYield, void, string | undefined> {
  const sourceLines = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const heap = new MemoryHeap();
  const globals = new Map<string, PyObj>();
  const steps: TraceStep[] = [];
  let outputSoFar = '';
  let stderrSoFar = '';
  let stepCounter = 0;
  let lastSceneHint: Record<string, unknown> | undefined = undefined;

  // Populate built-in functions/constructors
  for (const name of PYTHON_BUILTINS) {
    globals.set(name, heap.makeBuiltin(name));
  }

  function currentEnvVars(
    env: Map<string, PyObj>,
    prevVars: Map<string, number>,
    deletedNames: string[] = []
  ): { list: TraceVariable[]; changed: string[] } {
    const idToNames = new Map<number, string[]>();
    const entries: Array<[string, PyObj]> = [];
    for (const [k, v] of env.entries()) {
      // Hide unshadowed builtins and modules so Memory panel stays clean & learner-focused
      if (v.type === 'function' && (v.val as PyBuiltinVal).name === k && (PYTHON_BUILTINS as readonly string[]).includes(k)) {
        continue;
      }
      if (v.type === 'module') {
        continue;
      }
      entries.push([k, v]);
      const arr = idToNames.get(v.id) ?? [];
      arr.push(k);
      idToNames.set(v.id, arr);
    }

    const changed: string[] = [];
    const list: TraceVariable[] = entries.map(([name, obj]) => {
      const prevId = prevVars.get(name);
      const isNew = prevId === undefined;
      const isChanged = isNew || prevId !== obj.id;
      if (isChanged) changed.push(name);
      const peers = (idToNames.get(obj.id) ?? []).filter((n) => n !== name);
      return {
        name,
        objectId: obj.id,
        type: obj.type,
        repr: pyRepr(obj),
        mutable: obj.mutable,
        isNew,
        changed: isChanged,
        aliasedWith: peers,
      };
    });

    for (const d of deletedNames) {
      if (!changed.includes(d)) changed.push(d);
    }

    return { list, changed };
  }

  function snapshotVarIds(env: Map<string, PyObj>): Map<string, number> {
    const map = new Map<string, number>();
    for (const [k, v] of env.entries()) {
      if (v.type === 'function' && (v.val as PyBuiltinVal).name === k && (PYTHON_BUILTINS as readonly string[]).includes(k)) {
        continue;
      }
      map.set(k, v.id);
    }
    return map;
  }

  function emitStep(
    line: number,
    env: Map<string, PyObj>,
    prevIds: Map<string, number>,
    narration: string,
    explainMore: string,
    eventKind: TraceStep['eventKind'],
    outputDelta = '',
    stderrDelta = '',
    deletedNames: string[] = []
  ): TraceStep {
    if (stepCounter >= MAX_STEPS) {
      throw new PyError('RuntimeError', `Program stopped after ${MAX_STEPS} steps to prevent an infinite loop.`, line);
    }
    const { list, changed } = currentEnvVars(env, prevIds, deletedNames);
    const trace: TraceStep = {
      stepIndex: stepCounter++,
      line,
      codeLine: (sourceLines[line - 1] ?? '').trim(),
      narration,
      explainMore,
      variables: list,
      heap: heap.snapshot(),
      outputSoFar,
      outputDelta,
      stderrDelta: stderrDelta || undefined,
      eventKind,
      changedNames: changed,
      deletedNames: deletedNames.length > 0 ? deletedNames : undefined,
      sceneHint: lastSceneHint,
    };
    lastSceneHint = undefined;
    steps.push(trace);
    return trace;
  }

  function lookupName(name: string, env: Map<string, PyObj>, line: number): PyObj {
    if (env.has(name)) return env.get(name)!;
    if (globals.has(name)) return globals.get(name)!;
    throw new PyError('NameError', `name '${name}' is not defined`, line);
  }

  function toIterable(obj: PyObj, line: number): PyObj[] {
    switch (obj.type) {
      case 'list':
      case 'tuple':
      case 'set':
      case 'frozenset':
        return [...(obj.val as PyObj[])];
      case 'str':
        return Array.from(obj.val as string).map((ch) => heap.makeStr(ch));
      case 'range':
        return rangeToArray(obj.val as PyRangeVal).map((n) => heap.makeInt(n));
      case 'dict': {
        const map = obj.val as Map<string, { key: PyObj; value: PyObj }>;
        return Array.from(map.values()).map((e) => e.key);
      }
      case 'bytes':
      case 'bytearray':
        return Array.from(obj.val as Uint8Array).map((b) => heap.makeInt(b));
      default:
        throw new PyError('TypeError', `'${obj.type}' object is not iterable`, line);
    }
  }

  function toNumber(obj: PyObj, line: number): number {
    if (obj.type === 'int' || obj.type === 'float') return Number(obj.val);
    if (obj.type === 'bool') return obj.val ? 1 : 0;
    throw new PyError('TypeError', `expected number, got '${obj.type}'`, line);
  }

  function* bindTarget(target: TargetNode, value: PyObj, env: Map<string, PyObj>): EvalGen {
    if (target.kind === 'NameTarget') {
      env.set(target.name, value);
      return value;
    }
    if (target.kind === 'TupleTarget') {
      const items = toIterable(value, target.line);
      const starIdx = target.elements.findIndex((el) => el.kind === 'StarTarget');
      if (starIdx === -1) {
        if (items.length < target.elements.length) {
          throw new PyError(
            'ValueError',
            `not enough values to unpack (expected ${target.elements.length}, got ${items.length})`,
            target.line
          );
        }
        if (items.length > target.elements.length) {
          throw new PyError(
            'ValueError',
            `too many values to unpack (expected ${target.elements.length}, got ${items.length})`,
            target.line
          );
        }
        for (let i = 0; i < target.elements.length; i++) {
          yield* bindTarget(target.elements[i], items[i], env);
        }
      } else {
        const before = starIdx;
        const after = target.elements.length - starIdx - 1;
        if (items.length < before + after) {
          throw new PyError(
            'ValueError',
            `not enough values to unpack (expected at least ${before + after}, got ${items.length})`,
            target.line
          );
        }
        for (let i = 0; i < before; i++) {
          yield* bindTarget(target.elements[i], items[i], env);
        }
        const starSlice = items.slice(before, items.length - after);
        const starTarget = target.elements[starIdx];
        if (starTarget.kind === 'StarTarget') {
          yield* bindTarget(starTarget.target, heap.makeList(starSlice), env);
        }
        for (let i = 0; i < after; i++) {
          yield* bindTarget(target.elements[starIdx + 1 + i], items[items.length - after + i], env);
        }
      }
      return value;
    }
    if (target.kind === 'SubscriptTarget') {
      const container = yield* evalExpr(target.object, env);
      const idxObj = yield* evalExpr(target.index, env);
      if (container.type === 'list') {
        const arr = container.val as PyObj[];
        let idx = Math.trunc(toNumber(idxObj, target.line));
        if (idx < 0) idx += arr.length;
        if (idx < 0 || idx >= arr.length) throw new PyError('IndexError', 'list assignment index out of range', target.line);
        arr[idx] = value;
        return value;
      }
      if (container.type === 'dict') {
        const map = container.val as Map<string, { key: PyObj; value: PyObj }>;
        map.set(pyHashKey(idxObj), { key: idxObj, value });
        return value;
      }
      if (container.type === 'bytearray') {
        const arr = container.val as Uint8Array;
        let idx = Math.trunc(toNumber(idxObj, target.line));
        if (idx < 0) idx += arr.length;
        if (idx < 0 || idx >= arr.length) throw new PyError('IndexError', 'bytearray index out of range', target.line);
        const bv = Math.trunc(toNumber(value, target.line));
        if (bv < 0 || bv > 255) throw new PyError('ValueError', 'byte must be in range(0, 256)', target.line);
        arr[idx] = bv;
        return value;
      }
      throw new PyError('TypeError', `'${container.type}' object does not support item assignment`, target.line);
    }
    if (target.kind === 'SubscriptSliceTarget') {
      const container = yield* evalExpr(target.object, env);
      if (container.type !== 'list') {
        throw new PyError('TypeError', `'${container.type}' object does not support slice assignment`, target.line);
      }
      const arr = container.val as PyObj[];
      const step = target.step ? Math.trunc(toNumber(yield* evalExpr(target.step, env), target.line)) : 1;
      if (step === 0) throw new PyError('ValueError', 'slice step cannot be zero', target.line);
      const len = arr.length;
      let start = target.lower ? Math.trunc(toNumber(yield* evalExpr(target.lower, env), target.line)) : step > 0 ? 0 : len - 1;
      let stop = target.upper ? Math.trunc(toNumber(yield* evalExpr(target.upper, env), target.line)) : step > 0 ? len : -len - 1;
      if (start < 0) start += len;
      if (stop < 0 && !(target.upper === null && step < 0)) stop += len;
      start = Math.max(0, Math.min(start, len));
      stop = Math.max(start, Math.min(stop, len));
      const rep = toIterable(value, target.line);
      if (step === 1) {
        arr.splice(start, stop - start, ...rep);
      } else {
        const indices: number[] = [];
        for (let i = start; step > 0 ? i < stop : i > stop; i += step) indices.push(i);
        if (rep.length !== indices.length) {
          throw new PyError('ValueError', `attempt to assign sequence of size ${rep.length} to extended slice of size ${indices.length}`, target.line);
        }
        indices.forEach((idx, k) => {
          arr[idx] = rep[k];
        });
      }
      return value;
    }
    throw new PyError('SyntaxError', 'unsupported assignment target', target.line);
  }

  function applyBinary(op: string, left: PyObj, right: PyObj, line: number): PyObj {
    // String repetition or concatenation
    if (op === '+') {
      if (left.type === 'str' && right.type === 'str') {
        return heap.makeStr(String(left.val) + String(right.val));
      }
      if (left.type === 'list' && right.type === 'list') {
        return heap.makeList([...(left.val as PyObj[]), ...(right.val as PyObj[])]);
      }
      if (left.type === 'tuple' && right.type === 'tuple') {
        return heap.makeTuple([...(left.val as PyObj[]), ...(right.val as PyObj[])]);
      }
      if ((left.type === 'bytes' || left.type === 'bytearray') && (right.type === 'bytes' || right.type === 'bytearray')) {
        const ba = left.val as Uint8Array;
        const bb = right.val as Uint8Array;
        const out = new Uint8Array(ba.length + bb.length);
        out.set(ba, 0);
        out.set(bb, ba.length);
        return heap.makeBytes(out, left.type === 'bytearray');
      }
      if (left.type === 'complex' || right.type === 'complex') {
        const lc = left.type === 'complex' ? (left.val as PyComplexVal) : { real: toNumber(left, line), imag: 0 };
        const rc = right.type === 'complex' ? (right.val as PyComplexVal) : { real: toNumber(right, line), imag: 0 };
        return heap.makeComplex(lc.real + rc.real, lc.imag + rc.imag);
      }
      if ((left.type === 'int' || left.type === 'float' || left.type === 'bool') &&
          (right.type === 'int' || right.type === 'float' || right.type === 'bool')) {
        const sum = toNumber(left, line) + toNumber(right, line);
        return left.type === 'float' || right.type === 'float' ? heap.makeFloat(sum) : heap.makeInt(sum);
      }
      throw new PyError('TypeError', `unsupported operand type(s) for +: '${left.type}' and '${right.type}'`, line);
    }

    if (op === '*') {
      if (left.type === 'str' && (right.type === 'int' || right.type === 'bool')) {
        return heap.makeStr(String(left.val).repeat(Math.max(0, toNumber(right, line))));
      }
      if (right.type === 'str' && (left.type === 'int' || left.type === 'bool')) {
        return heap.makeStr(String(right.val).repeat(Math.max(0, toNumber(left, line))));
      }
      if ((left.type === 'bytes' || left.type === 'bytearray') && (right.type === 'int' || right.type === 'bool')) {
        const count = Math.max(0, Math.trunc(toNumber(right, line)));
        const src = left.val as Uint8Array;
        const out = new Uint8Array(src.length * count);
        for (let i = 0; i < count; i++) out.set(src, i * src.length);
        return heap.makeBytes(out, left.type === 'bytearray');
      }
      if (left.type === 'list' && (right.type === 'int' || right.type === 'bool')) {
        const count = Math.max(0, toNumber(right, line));
        const res: PyObj[] = [];
        for (let i = 0; i < count; i++) res.push(...(left.val as PyObj[]));
        return heap.makeList(res);
      }
      if (left.type === 'tuple' && (right.type === 'int' || right.type === 'bool')) {
        const count = Math.max(0, toNumber(right, line));
        const res: PyObj[] = [];
        for (let i = 0; i < count; i++) res.push(...(left.val as PyObj[]));
        return heap.makeTuple(res);
      }
      if (left.type === 'complex' || right.type === 'complex') {
        const lc = left.type === 'complex' ? (left.val as PyComplexVal) : { real: toNumber(left, line), imag: 0 };
        const rc = right.type === 'complex' ? (right.val as PyComplexVal) : { real: toNumber(right, line), imag: 0 };
        return heap.makeComplex(lc.real * rc.real - lc.imag * rc.imag, lc.real * rc.imag + lc.imag * rc.real);
      }
      if ((left.type === 'int' || left.type === 'float' || left.type === 'bool') &&
          (right.type === 'int' || right.type === 'float' || right.type === 'bool')) {
        const prod = toNumber(left, line) * toNumber(right, line);
        return left.type === 'float' || right.type === 'float' ? heap.makeFloat(prod) : heap.makeInt(prod);
      }
      throw new PyError('TypeError', `can't multiply sequence by non-int of type '${right.type}'`, line);
    }

    // Dict union operator (d1 | d2, Python 3.9+)
    if (left.type === 'dict' && right.type === 'dict' && op === '|') {
      const ma = left.val as Map<string, { key: PyObj; value: PyObj }>;
      const mb = right.val as Map<string, { key: PyObj; value: PyObj }>;
      return heap.makeDict([
        ...Array.from(ma.values()).map((e): [PyObj, PyObj] => [e.key, e.value]),
        ...Array.from(mb.values()).map((e): [PyObj, PyObj] => [e.key, e.value]),
      ]);
    }

    // Set operators
    if ((left.type === 'set' || left.type === 'frozenset') && (right.type === 'set' || right.type === 'frozenset')) {
      const a = left.val as PyObj[];
      const b = right.val as PyObj[];
      const frozen = left.type === 'frozenset';
      if (op === '|') return heap.makeSet([...a, ...b], frozen);
      if (op === '&') {
        const bKeys = new Set(b.map(pyHashKey));
        return heap.makeSet(a.filter((x) => bKeys.has(pyHashKey(x))), frozen);
      }
      if (op === '-') {
        const bKeys = new Set(b.map(pyHashKey));
        return heap.makeSet(a.filter((x) => !bKeys.has(pyHashKey(x))), frozen);
      }
      if (op === '^') {
        const aKeys = new Set(a.map(pyHashKey));
        const bKeys = new Set(b.map(pyHashKey));
        return heap.makeSet([...a.filter((x) => !bKeys.has(pyHashKey(x))), ...b.filter((x) => !aKeys.has(pyHashKey(x)))], frozen);
      }
    }

    // String % formatting ("Hello %s, score %d" % (name, 95))
    if (left.type === 'str' && op === '%') {
      const template = String(left.val);
      const argsList = right.type === 'tuple' ? (right.val as PyObj[]) : [right];
      let argIdx = 0;
      const formatted = template.replace(/%(%|0?\d*(?:\.\d+)?[sdf])/g, (full, spec: string) => {
        if (spec === '%') return '%';
        if (argIdx >= argsList.length) {
          throw new PyError('TypeError', 'not enough arguments for format string', line);
        }
        const val = argsList[argIdx++];
        const code = spec[spec.length - 1];
        if (code === 's') return pyStr(val);
        if (code === 'd') {
          const n = Math.trunc(toNumber(val, line));
          const widthMatch = spec.match(/^(0)?(\d+)/);
          if (widthMatch) {
            const pad = widthMatch[1] === '0' ? '0' : ' ';
            return String(n).padStart(parseInt(widthMatch[2], 10), pad);
          }
          return String(n);
        }
        if (code === 'f') {
          const n = toNumber(val, line);
          const precMatch = spec.match(/\.(\d+)/);
          const prec = precMatch ? parseInt(precMatch[1], 10) : 6;
          return n.toFixed(prec);
        }
        return full;
      });
      return heap.makeStr(formatted);
    }

    // Complex subtraction & division & power
    if (left.type === 'complex' || right.type === 'complex') {
      const lc = left.type === 'complex' ? (left.val as PyComplexVal) : { real: toNumber(left, line), imag: 0 };
      const rc = right.type === 'complex' ? (right.val as PyComplexVal) : { real: toNumber(right, line), imag: 0 };
      if (op === '-') return heap.makeComplex(lc.real - rc.real, lc.imag - rc.imag);
      if (op === '/') {
        const denom = rc.real * rc.real + rc.imag * rc.imag;
        if (denom === 0) throw new PyError('ZeroDivisionError', 'complex division by zero', line);
        return heap.makeComplex(
          (lc.real * rc.real + lc.imag * rc.imag) / denom,
          (lc.imag * rc.real - lc.real * rc.imag) / denom
        );
      }
      if (op === '**' && right.type === 'int' && Number(right.val) >= 0) {
        let resR = 1;
        let resI = 0;
        const exp = Math.trunc(Number(right.val));
        for (let k = 0; k < exp; k++) {
          const nr = resR * lc.real - resI * lc.imag;
          const ni = resR * lc.imag + resI * lc.real;
          resR = nr;
          resI = ni;
        }
        return heap.makeComplex(resR, resI);
      }
      throw new PyError('TypeError', `unsupported operand type(s) for ${op}: '${left.type}' and '${right.type}'`, line);
    }

    // Bitwise ops on int / bool
    if (['&', '|', '^', '<<', '>>'].includes(op)) {
      if ((left.type === 'int' || left.type === 'bool') && (right.type === 'int' || right.type === 'bool')) {
        const ia = Math.trunc(toNumber(left, line));
        const ib = Math.trunc(toNumber(right, line));
        let res = 0;
        if (op === '&') res = ia & ib;
        else if (op === '|') res = ia | ib;
        else if (op === '^') res = ia ^ ib;
        else if (op === '<<') {
          if (ib < 0) throw new PyError('ValueError', 'negative shift count', line);
          res = ia << ib;
        } else {
          if (ib < 0) throw new PyError('ValueError', 'negative shift count', line);
          res = ia >> ib;
        }
        if (left.type === 'bool' && right.type === 'bool' && (op === '&' || op === '|' || op === '^')) {
          return heap.makeBool(Boolean(res));
        }
        return heap.makeInt(res);
      }
      throw new PyError('TypeError', `unsupported operand type(s) for ${op}: '${left.type}' and '${right.type}'`, line);
    }

    // Standard numeric ops
    const a = toNumber(left, line);
    const b = toNumber(right, line);
    const isFloat = left.type === 'float' || right.type === 'float';

    switch (op) {
      case '-': {
        const res = a - b;
        return isFloat ? heap.makeFloat(res) : heap.makeInt(res);
      }
      case '/': {
        if (b === 0) throw new PyError('ZeroDivisionError', 'division by zero', line);
        return heap.makeFloat(a / b);
      }
      case '//': {
        if (b === 0) throw new PyError('ZeroDivisionError', 'integer division or modulo by zero', line);
        const res = Math.floor(a / b);
        return isFloat ? heap.makeFloat(res) : heap.makeInt(res);
      }
      case '%': {
        if (b === 0) throw new PyError('ZeroDivisionError', 'integer division or modulo by zero', line);
        const res = ((a % b) + b) % b;
        return isFloat ? heap.makeFloat(res) : heap.makeInt(res);
      }
      case '**': {
        const res = Math.pow(a, b);
        return isFloat || b < 0 ? heap.makeFloat(res) : heap.makeInt(res);
      }
      default:
        throw new PyError('TypeError', `unsupported operand type(s) for ${op}: '${left.type}' and '${right.type}'`, line);
    }
  }

  function* evalExpr(expr: ExprNode, env: Map<string, PyObj>): EvalGen {
    switch (expr.kind) {
      case 'Literal': {
        switch (expr.pyType) {
          case 'int': return heap.makeInt(Number(expr.value));
          case 'float': return heap.makeFloat(Number(expr.value));
          case 'complex': return heap.makeComplex(0, Number(expr.value));
          case 'str': return heap.makeStr(String(expr.value));
          case 'bool': return heap.makeBool(Boolean(expr.value));
          case 'None': return heap.makeNone();
          case 'bytes': {
            const raw = String(expr.value);
            return heap.makeBytes(Uint8Array.from(Array.from(raw).map((ch) => ch.charCodeAt(0) & 0xff)), false);
          }
        }
      }
      case 'FString': {
        let out = '';
        for (const part of expr.parts) {
          if (part.type === 'text') {
            out += part.value;
          } else {
            const val = yield* evalExpr(part.expr, env);
            out += formatWithSpec(val, part.spec);
          }
        }
        return heap.makeStr(out);
      }
      case 'Name':
        return lookupName(expr.name, env, expr.line);
      case 'List': {
        const items: PyObj[] = [];
        for (const el of expr.elements) {
          if (el.kind === 'Starred') {
            const inner = yield* evalExpr(el.value, env);
            items.push(...toIterable(inner, expr.line));
          } else {
            items.push(yield* evalExpr(el, env));
          }
        }
        return heap.makeList(items);
      }
      case 'ListComp': {
        const iterVal = yield* evalExpr(expr.iter, env);
        const items = toIterable(iterVal, expr.line);
        const result: PyObj[] = [];
        const localEnv = new Map(env);
        for (const item of items) {
          yield* bindTarget(expr.target, item, localEnv);
          if (expr.cond) {
            const c = yield* evalExpr(expr.cond, localEnv);
            if (!pyBool(c)) continue;
          }
          result.push(yield* evalExpr(expr.elt, localEnv));
        }
        return heap.makeList(result);
      }
      case 'Tuple': {
        const items: PyObj[] = [];
        for (const el of expr.elements) {
          if (el.kind === 'Starred') {
            const inner = yield* evalExpr(el.value, env);
            items.push(...toIterable(inner, expr.line));
          } else {
            items.push(yield* evalExpr(el, env));
          }
        }
        return heap.makeTuple(items);
      }
      case 'Dict': {
        const entries: Array<[PyObj, PyObj]> = [];
        for (const e of expr.entries) {
          const k = yield* evalExpr(e.key, env);
          const v = yield* evalExpr(e.value, env);
          entries.push([k, v]);
        }
        return heap.makeDict(entries);
      }
      case 'Set': {
        const items: PyObj[] = [];
        for (const el of expr.elements) {
          items.push(yield* evalExpr(el, env));
        }
        return heap.makeSet(items, false);
      }
      case 'Unary': {
        const operand = yield* evalExpr(expr.operand, env);
        if (expr.op === 'not') return heap.makeBool(!pyBool(operand));
        if (expr.op === '-') {
          if (operand.type === 'int') return heap.makeInt(-Number(operand.val));
          if (operand.type === 'float') return heap.makeFloat(-Number(operand.val));
          if (operand.type === 'bool') return heap.makeInt(operand.val ? -1 : 0);
          if (operand.type === 'complex') {
            const c = operand.val as PyComplexVal;
            return heap.makeComplex(-c.real, -c.imag);
          }
          throw new PyError('TypeError', `bad operand type for unary -: '${operand.type}'`, expr.line);
        }
        if (expr.op === '+') {
          if (operand.type === 'int' || operand.type === 'float' || operand.type === 'complex') return operand;
          if (operand.type === 'bool') return heap.makeInt(operand.val ? 1 : 0);
        }
        if (expr.op === '~') {
          if (operand.type === 'int' || operand.type === 'bool') {
            return heap.makeInt(~Math.trunc(toNumber(operand, expr.line)));
          }
        }
        throw new PyError('TypeError', `bad operand type for unary ${expr.op}: '${operand.type}'`, expr.line);
      }
      case 'Binary': {
        const left = yield* evalExpr(expr.left, env);
        const right = yield* evalExpr(expr.right, env);
        return applyBinary(expr.op, left, right, expr.line);
      }
      case 'BoolOp': {
        let last = heap.makeNone();
        for (const valNode of expr.values) {
          last = yield* evalExpr(valNode, env);
          const truth = pyBool(last);
          if (expr.op === 'and' && !truth) return last;
          if (expr.op === 'or' && truth) return last;
        }
        return last;
      }
      case 'Compare': {
        let left = yield* evalExpr(expr.left, env);
        for (let i = 0; i < expr.ops.length; i++) {
          const op = expr.ops[i];
          const right = yield* evalExpr(expr.comparators[i], env);
          let ok = false;
          if (op === '==') ok = pyEquals(left, right);
          else if (op === '!=') ok = !pyEquals(left, right);
          else if (op === 'is') ok = left.id === right.id;
          else if (op === 'is not') ok = left.id !== right.id;
          else if (op === 'in' || op === 'not in') {
            let found = false;
            if (right.type === 'str' && left.type === 'str') {
              found = String(right.val).includes(String(left.val));
            } else if ((right.type === 'bytes' || right.type === 'bytearray') && (left.type === 'bytes' || left.type === 'bytearray')) {
              const hay = Array.from(right.val as Uint8Array).map((b) => String.fromCharCode(b)).join('');
              const needle = Array.from(left.val as Uint8Array).map((b) => String.fromCharCode(b)).join('');
              found = hay.includes(needle);
            } else if (right.type === 'dict') {
              const map = right.val as Map<string, { key: PyObj; value: PyObj }>;
              found = map.has(pyHashKey(left));
            } else {
              const items = toIterable(right, expr.line);
              found = items.some((x) => pyEquals(x, left));
            }
            ok = op === 'in' ? found : !found;
          } else {
            if ((left.type === 'set' || left.type === 'frozenset') && (right.type === 'set' || right.type === 'frozenset')) {
              const lk = new Set((left.val as PyObj[]).map(pyHashKey));
              const rk = new Set((right.val as PyObj[]).map(pyHashKey));
              const isSub = Array.from(lk).every((k) => rk.has(k));
              const isSup = Array.from(rk).every((k) => lk.has(k));
              ok =
                op === '<=' ? isSub :
                op === '<' ? isSub && lk.size < rk.size :
                op === '>=' ? isSup :
                isSup && lk.size > rk.size;
            } else if (left.type === 'str' && right.type === 'str') {
              const ls = String(left.val), rs = String(right.val);
              ok = op === '<' ? ls < rs : op === '<=' ? ls <= rs : op === '>' ? ls > rs : ls >= rs;
            } else {
              const ln = toNumber(left, expr.line), rn = toNumber(right, expr.line);
              ok = op === '<' ? ln < rn : op === '<=' ? ln <= rn : op === '>' ? ln > rn : ln >= rn;
            }
          }
          if (!ok) return heap.makeBool(false);
          left = right;
        }
        return heap.makeBool(true);
      }
      case 'IfExpr': {
        const cond = yield* evalExpr(expr.test, env);
        return pyBool(cond) ? (yield* evalExpr(expr.body, env)) : (yield* evalExpr(expr.orelse, env));
      }
      case 'Subscript': {
        const obj = yield* evalExpr(expr.object, env);
        if (!expr.slice.isSlice) {
          const idxObj = yield* evalExpr(expr.slice.index, env);
          if (obj.type === 'dict') {
            const map = obj.val as Map<string, { key: PyObj; value: PyObj }>;
            const entry = map.get(pyHashKey(idxObj));
            if (!entry) throw new PyError('KeyError', pyRepr(idxObj), expr.line);
            return entry.value;
          }
          if (obj.type === 'str') {
            const s = String(obj.val);
            let idx = Math.trunc(toNumber(idxObj, expr.line));
            if (idx < 0) idx += s.length;
            if (idx < 0 || idx >= s.length) throw new PyError('IndexError', 'string index out of range', expr.line);
            return heap.makeStr(s[idx]);
          }
          if (obj.type === 'bytes' || obj.type === 'bytearray') {
            const arr = obj.val as Uint8Array;
            let idx = Math.trunc(toNumber(idxObj, expr.line));
            if (idx < 0) idx += arr.length;
            if (idx < 0 || idx >= arr.length) throw new PyError('IndexError', 'index out of range', expr.line);
            return heap.makeInt(arr[idx]);
          }
          if (obj.type === 'list' || obj.type === 'tuple') {
            const arr = obj.val as PyObj[];
            let idx = Math.trunc(toNumber(idxObj, expr.line));
            if (idx < 0) idx += arr.length;
            if (idx < 0 || idx >= arr.length) throw new PyError('IndexError', `${obj.type} index out of range`, expr.line);
            return arr[idx];
          }
          if (obj.type === 'range') {
            const r = obj.val as PyRangeVal;
            const len = rangeLength(r);
            let idx = Math.trunc(toNumber(idxObj, expr.line));
            if (idx < 0) idx += len;
            if (idx < 0 || idx >= len) throw new PyError('IndexError', 'range object index out of range', expr.line);
            return heap.makeInt(r.start + idx * r.step);
          }
          throw new PyError('TypeError', `'${obj.type}' object is not subscriptable`, expr.line);
        } else {
          const step = expr.slice.step ? Math.trunc(toNumber(yield* evalExpr(expr.slice.step, env), expr.line)) : 1;
          if (step === 0) throw new PyError('ValueError', 'slice step cannot be zero', expr.line);
          if (obj.type === 'range') {
            const r = obj.val as PyRangeVal;
            const len = rangeLength(r);
            let start = expr.slice.lower ? Math.trunc(toNumber(yield* evalExpr(expr.slice.lower, env), expr.line)) : step > 0 ? 0 : len - 1;
            let stop = expr.slice.upper ? Math.trunc(toNumber(yield* evalExpr(expr.slice.upper, env), expr.line)) : step > 0 ? len : -len - 1;
            if (start < 0) start += len;
            if (stop < 0 && !(expr.slice.upper === null && step < 0)) stop += len;
            start = Math.max(step > 0 ? 0 : -1, Math.min(start, step > 0 ? len : len - 1));
            stop = Math.max(step > 0 ? 0 : -1, Math.min(stop, step > 0 ? len : len - 1));
            const newStart = r.start + start * r.step;
            const newStop = r.start + stop * r.step;
            const newStep = r.step * step;
            return heap.makeRange(newStart, newStop, newStep);
          }
          if (obj.type === 'bytes' || obj.type === 'bytearray') {
            const arr = obj.val as Uint8Array;
            const len = arr.length;
            let start = expr.slice.lower ? Math.trunc(toNumber(yield* evalExpr(expr.slice.lower, env), expr.line)) : step > 0 ? 0 : len - 1;
            let stop = expr.slice.upper ? Math.trunc(toNumber(yield* evalExpr(expr.slice.upper, env), expr.line)) : step > 0 ? len : -len - 1;
            if (start < 0) start += len;
            if (stop < 0 && !(expr.slice.upper === null && step < 0)) stop += len;
            start = Math.max(step > 0 ? 0 : -1, Math.min(start, step > 0 ? len : len - 1));
            stop = Math.max(step > 0 ? 0 : -1, Math.min(stop, step > 0 ? len : len - 1));
            const out: number[] = [];
            if (step > 0) {
              for (let i = start; i < stop; i += step) out.push(arr[i]);
            } else {
              for (let i = start; i > stop; i += step) out.push(arr[i]);
            }
            return heap.makeBytes(new Uint8Array(out), obj.type === 'bytearray');
          }
          if (obj.type !== 'str' && obj.type !== 'list' && obj.type !== 'tuple') {
            throw new PyError('TypeError', `'${obj.type}' object is not subscriptable`, expr.line);
          }
          const arr = obj.type === 'str'
            ? Array.from(String(obj.val)).map((c) => heap.makeStr(c))
            : (obj.val as PyObj[]);
          const len = arr.length;
          let start = expr.slice.lower ? Math.trunc(toNumber(yield* evalExpr(expr.slice.lower, env), expr.line)) : step > 0 ? 0 : len - 1;
          let stop = expr.slice.upper ? Math.trunc(toNumber(yield* evalExpr(expr.slice.upper, env), expr.line)) : step > 0 ? len : -len - 1;
          if (start < 0) start += len;
          if (stop < 0 && !(expr.slice.upper === null && step < 0)) stop += len;
          start = Math.max(step > 0 ? 0 : -1, Math.min(start, step > 0 ? len : len - 1));
          stop = Math.max(step > 0 ? 0 : -1, Math.min(stop, step > 0 ? len : len - 1));
          const sliced: PyObj[] = [];
          if (step > 0) {
            for (let i = start; i < stop; i += step) sliced.push(arr[i]);
          } else {
            for (let i = start; i > stop; i += step) sliced.push(arr[i]);
          }
          if (obj.type === 'str') return heap.makeStr(sliced.map((x) => String(x.val)).join(''));
          if (obj.type === 'tuple') return heap.makeTuple(sliced);
          return heap.makeList(sliced);
        }
      }
      case 'Attribute': {
        const obj = yield* evalExpr(expr.object, env);
        if (obj.type === 'range') {
          const r = obj.val as PyRangeVal;
          if (expr.attr === 'start') return heap.makeInt(r.start);
          if (expr.attr === 'stop') return heap.makeInt(r.stop);
          if (expr.attr === 'step') return heap.makeInt(r.step);
        }
        if (obj.type === 'complex') {
          const c = obj.val as PyComplexVal;
          if (expr.attr === 'real') return heap.makeFloat(c.real);
          if (expr.attr === 'imag') return heap.makeFloat(c.imag);
        }
        if (obj.type === 'int' || obj.type === 'bool') {
          const n = obj.type === 'bool' ? (obj.val ? 1 : 0) : Number(obj.val);
          if (expr.attr === 'real') return heap.makeInt(n);
          if (expr.attr === 'imag') return heap.makeInt(0);
        }
        if (obj.type === 'float') {
          if (expr.attr === 'real') return obj;
          if (expr.attr === 'imag') return heap.makeFloat(0.0);
        }
        if (obj.type === 'module') {
          const mod = obj.val as PyModuleVal;
          if (expr.attr in mod.attrs) return mod.attrs[expr.attr];
          throw new PyError('AttributeError', `module '${mod.name}' has no attribute '${expr.attr}'`, expr.line);
        }
        throw new PyError('AttributeError', `'${obj.type}' object has no attribute '${expr.attr}'`, expr.line);
      }
      case 'Call': {
        // Method call on an object
        if (expr.func.kind === 'Attribute') {
          const targetObj = yield* evalExpr(expr.func.object, env);
          const method = expr.func.attr;
          const evalArgs: PyObj[] = [];
          for (const a of expr.args) evalArgs.push(yield* evalExpr(a, env));
          const kwargs: Record<string, PyObj> = {};
          for (const kw of expr.kwargs) kwargs[kw.name] = yield* evalExpr(kw.value, env);
          if (targetObj.type === 'module') {
            const mod = targetObj.val as PyModuleVal;
            const member = mod.attrs[method];
            if (!member || member.type !== 'function') {
              throw new PyError('AttributeError', `module '${mod.name}' has no callable '${method}'`, expr.line);
            }
            const bName = (member.val as PyBuiltinVal).name;
            return callBuiltin(bName, evalArgs, kwargs, expr.line);
          }
          return callMethod(targetObj, method, evalArgs, kwargs, expr.line);
        }

        const fnObj = yield* evalExpr(expr.func, env);
        const evalArgs: PyObj[] = [];
        for (const a of expr.args) {
          if (a.kind === 'Starred') {
            const inner = yield* evalExpr(a.value, env);
            evalArgs.push(...toIterable(inner, expr.line));
          } else {
            evalArgs.push(yield* evalExpr(a, env));
          }
        }
        const kwargs: Record<string, PyObj> = {};
        for (const kw of expr.kwargs) {
          kwargs[kw.name] = yield* evalExpr(kw.value, env);
        }

        if (fnObj.type !== 'function') {
          throw new PyError('TypeError', `'${fnObj.type}' object is not callable`, expr.line);
        }

        const fnVal = fnObj.val as PyFunctionVal | PyBuiltinVal;
        if ('body' in fnVal) {
          const callEnv = new Map(fnVal.closure);
          for (let i = 0; i < fnVal.params.length; i++) {
            callEnv.set(fnVal.params[i], evalArgs[i] ?? heap.makeNone());
          }
          const sig = yield* execBlock(fnVal.body as StmtNode[], callEnv, false);
          if (sig && sig.kind === 'return') return sig.value ?? heap.makeNone();
          return heap.makeNone();
        }

        // Built-in calls
        const bName = fnVal.name;
        if (bName === 'input') {
          const prompt = evalArgs[0] ? pyStr(evalArgs[0]) : '';
          outputSoFar += prompt;
          const userAnswer = yield {
            kind: 'input',
            prompt,
            line: expr.line,
            partialOutput: outputSoFar,
          };
          const clean = (userAnswer ?? '').replace(/\r?\n$/, '');
          outputSoFar += clean + '\n';
          lastSceneHint = {
            ...(lastSceneHint ?? {}),
            inputEvent: {
              prompt,
              typed: clean,
              returnedType: 'str',
            },
          };
          return heap.makeStr(clean);
        }
        if (bName === 'print') {
          const sep = kwargs.sep ? pyStr(kwargs.sep) : ' ';
          const end = kwargs.end ? pyStr(kwargs.end) : '\n';
          const flush = kwargs.flush ? pyBool(kwargs.flush) : false;
          const parts = evalArgs.map(pyStr);
          const text = parts.join(sep) + end;
          const fileDesc = kwargs.file ? pyStr(kwargs.file) : 'sys.stdout';
          const isStderr = fileDesc.includes('stderr');
          if (isStderr) {
            stderrSoFar += text;
          } else {
            outputSoFar += text;
          }
          lastSceneHint = {
            ...(lastSceneHint ?? {}),
            printEvent: {
              rawArgs: evalArgs.map((o) => ({ repr: pyRepr(o), text: pyStr(o), type: o.type })),
              sep,
              end,
              file: isStderr ? 'sys.stderr' : 'sys.stdout',
              flush,
              finalText: text,
            },
          };
          return heap.makeNone();
        }
        return callBuiltin(bName, evalArgs, kwargs, expr.line);
      }
      default:
        return heap.makeNone();
    }
  }

  function callBuiltin(name: string, args: PyObj[], kwargs: Record<string, PyObj>, line: number): PyObj {
    switch (name) {
      case 'type':
        if (args.length !== 1) throw new PyError('TypeError', 'type() takes 1 argument', line);
        return heap.makeStr(`<class '${args[0].type}'>`);
      case 'id':
        if (args.length !== 1) throw new PyError('TypeError', 'id() takes 1 argument', line);
        return heap.makeInt(args[0].id);
      case 'len': {
        if (args.length !== 1) throw new PyError('TypeError', 'len() takes exactly one argument', line);
        const x = args[0];
        if (x.type === 'str') return heap.makeInt((x.val as string).length);
        if (x.type === 'list' || x.type === 'tuple' || x.type === 'set' || x.type === 'frozenset') {
          return heap.makeInt((x.val as PyObj[]).length);
        }
        if (x.type === 'dict') return heap.makeInt((x.val as Map<string, unknown>).size);
        if (x.type === 'range') return heap.makeInt(rangeLength(x.val as PyRangeVal));
        if (x.type === 'bytes' || x.type === 'bytearray') return heap.makeInt((x.val as Uint8Array).length);
        throw new PyError('TypeError', `object of type '${x.type}' has no len()`, line);
      }
      case 'int': {
        if (args.length === 0) return heap.makeInt(0);
        const x = args[0];
        if (args.length === 2) {
          if (x.type !== 'str') throw new PyError('TypeError', "int() can't convert non-string with explicit base", line);
          const base = Math.trunc(toNumber(args[1], line));
          if (base < 2 || base > 36) throw new PyError('ValueError', 'int() base must be >= 2 and <= 36', line);
          const raw = String(x.val).trim().replace(/^(?:0[bBxXoO])/, '');
          const parsed = parseInt(String(x.val).trim(), base);
          if (!raw || Number.isNaN(parsed)) {
            throw new PyError('ValueError', `invalid literal for int() with base ${base}: ${pyRepr(x)}`, line);
          }
          return heap.makeInt(parsed);
        }
        if (x.type === 'int') return x;
        if (x.type === 'float') return heap.makeInt(Math.trunc(Number(x.val)));
        if (x.type === 'bool') return heap.makeInt(x.val ? 1 : 0);
        if (x.type === 'str') {
          const s = String(x.val).trim();
          if (!/^[+-]?\d+$/.test(s)) throw new PyError('ValueError', `invalid literal for int() with base 10: ${pyRepr(x)}`, line);
          return heap.makeInt(parseInt(s, 10));
        }
        throw new PyError('TypeError', `int() argument must be a string or a number, not '${x.type}'`, line);
      }
      case 'float': {
        if (args.length === 0) return heap.makeFloat(0.0);
        const x = args[0];
        if (x.type === 'float') return x;
        if (x.type === 'int') return heap.makeFloat(Number(x.val));
        if (x.type === 'bool') return heap.makeFloat(x.val ? 1.0 : 0.0);
        if (x.type === 'str') {
          const s = String(x.val).trim().toLowerCase();
          if (s === 'inf' || s === '+inf' || s === 'infinity' || s === '+infinity') return heap.makeFloat(Infinity);
          if (s === '-inf' || s === '-infinity') return heap.makeFloat(-Infinity);
          if (s === 'nan' || s === '+nan' || s === '-nan') return heap.makeFloat(NaN);
          const n = Number(s);
          if (s === '' || Number.isNaN(n)) throw new PyError('ValueError', `could not convert string to float: ${pyRepr(x)}`, line);
          return heap.makeFloat(n);
        }
        throw new PyError('TypeError', `float() argument must be a string or a real number, not '${x.type}'`, line);
      }
      case 'complex': {
        if (args.length === 0) return heap.makeComplex(0, 0);
        if (args.length === 1) {
          const x = args[0];
          if (x.type === 'complex') return x;
          if (x.type === 'int' || x.type === 'float' || x.type === 'bool') {
            return heap.makeComplex(toNumber(x, line), 0);
          }
          if (x.type === 'str') {
            const s = String(x.val).replace(/\s+/g, '');
            const m = s.match(/^([+-]?\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)j$/i);
            if (m) return heap.makeComplex(parseFloat(m[1]), parseFloat(m[2]));
            const imagOnly = s.match(/^([+-]?\d+(?:\.\d+)?)j$/i);
            if (imagOnly) return heap.makeComplex(0, parseFloat(imagOnly[1]));
            const realOnly = Number(s);
            if (s !== '' && !Number.isNaN(realOnly)) return heap.makeComplex(realOnly, 0);
            throw new PyError('ValueError', 'complex() arg is a malformed string', line);
          }
          throw new PyError('TypeError', `complex() first argument must be a string or a number, not '${x.type}'`, line);
        }
        return heap.makeComplex(toNumber(args[0], line), toNumber(args[1], line));
      }
      case 'str':
        return args.length === 0 ? heap.makeStr('') : heap.makeStr(pyStr(args[0]));
      case 'bool':
        return args.length === 0 ? heap.makeBool(false) : heap.makeBool(pyBool(args[0]));
      case 'list':
        return args.length === 0 ? heap.makeList([]) : heap.makeList(toIterable(args[0], line));
      case 'tuple':
        return args.length === 0 ? heap.makeTuple([]) : heap.makeTuple(toIterable(args[0], line));
      case 'set':
        return args.length === 0 ? heap.makeSet([], false) : heap.makeSet(toIterable(args[0], line), false);
      case 'frozenset':
        return args.length === 0 ? heap.makeSet([], true) : heap.makeSet(toIterable(args[0], line), true);
      case 'dict': {
        const entries: Array<[PyObj, PyObj]> = [];
        if (args[0]) {
          if (args[0].type === 'dict') {
            const src = args[0].val as Map<string, { key: PyObj; value: PyObj }>;
            for (const e of src.values()) entries.push([e.key, e.value]);
          } else {
            for (const item of toIterable(args[0], line)) {
              const pair = toIterable(item, line);
              if (pair.length !== 2) throw new PyError('ValueError', 'dictionary update sequence element has wrong length', line);
              entries.push([pair[0], pair[1]]);
            }
          }
        }
        for (const [k, v] of Object.entries(kwargs)) {
          entries.push([heap.makeStr(k), v]);
        }
        return heap.makeDict(entries);
      }
      case 'bytes':
      case 'bytearray': {
        const isMutable = name === 'bytearray';
        if (args.length === 0) return heap.makeBytes(new Uint8Array(0), isMutable);
        const first = args[0];
        if (first.type === 'int' || first.type === 'bool') {
          const n = Math.trunc(toNumber(first, line));
          if (n < 0) throw new PyError('ValueError', 'negative count', line);
          return heap.makeBytes(new Uint8Array(n), isMutable);
        }
        if (first.type === 'str') {
          return heap.makeBytes(new TextEncoder().encode(String(first.val)), isMutable);
        }
        if (first.type === 'bytes' || first.type === 'bytearray') {
          return heap.makeBytes(new Uint8Array(first.val as Uint8Array), isMutable);
        }
        const items = toIterable(first, line).map((item) => {
          const b = Math.trunc(toNumber(item, line));
          if (b < 0 || b > 255) throw new PyError('ValueError', 'bytes must be in range(0, 256)', line);
          return b;
        });
        return heap.makeBytes(new Uint8Array(items), isMutable);
      }
      case 'range': {
        const requireInt = (arg: PyObj): number => {
          if (arg.type === 'int') return Math.trunc(Number(arg.val));
          if (arg.type === 'bool') return arg.val ? 1 : 0;
          throw new PyError('TypeError', `'${arg.type}' object cannot be interpreted as an integer`, line);
        };
        if (args.length === 1) return heap.makeRange(0, requireInt(args[0]), 1);
        if (args.length === 2) return heap.makeRange(requireInt(args[0]), requireInt(args[1]), 1);
        if (args.length === 3) {
          const start = requireInt(args[0]);
          const stop = requireInt(args[1]);
          const step = requireInt(args[2]);
          if (step === 0) throw new PyError('ValueError', 'range() arg 3 must not be zero', line);
          return heap.makeRange(start, stop, step);
        }
        throw new PyError('TypeError', 'range expected at most 3 arguments', line);
      }
      case 'abs': {
        const x = args[0];
        if (x.type === 'complex') {
          const c = x.val as PyComplexVal;
          return heap.makeFloat(Math.hypot(c.real, c.imag));
        }
        const n = Math.abs(toNumber(x, line));
        return x.type === 'float' ? heap.makeFloat(n) : heap.makeInt(n);
      }
      case 'round': {
        const n = toNumber(args[0], line);
        const ndigits = args[1] ? Math.trunc(toNumber(args[1], line)) : 0;
        const factor = Math.pow(10, ndigits);
        const rounded = Math.round(n * factor) / factor;
        return args[1] ? heap.makeFloat(rounded) : heap.makeInt(rounded);
      }
      case 'divmod': {
        if (args.length !== 2) throw new PyError('TypeError', 'divmod expected 2 arguments', line);
        const a = toNumber(args[0], line);
        const b = toNumber(args[1], line);
        if (b === 0) throw new PyError('ZeroDivisionError', 'integer division or modulo by zero', line);
        const q = Math.floor(a / b);
        const r = ((a % b) + b) % b;
        const isFl = args[0].type === 'float' || args[1].type === 'float';
        return heap.makeTuple([isFl ? heap.makeFloat(q) : heap.makeInt(q), isFl ? heap.makeFloat(r) : heap.makeInt(r)]);
      }
      case 'pow': {
        const a = toNumber(args[0], line);
        const b = toNumber(args[1], line);
        if (args[2]) {
          const mod = Math.trunc(toNumber(args[2], line));
          if (mod === 0) throw new PyError('ValueError', 'pow() 3rd argument cannot be 0', line);
          const res = ((Math.pow(Math.trunc(a), Math.trunc(b)) % mod) + mod) % mod;
          return heap.makeInt(res);
        }
        const res = Math.pow(a, b);
        return args[0].type === 'float' || args[1].type === 'float' || b < 0 ? heap.makeFloat(res) : heap.makeInt(res);
      }
      case 'bin': {
        const n = Math.trunc(toNumber(args[0], line));
        return heap.makeStr(n < 0 ? `-0b${Math.abs(n).toString(2)}` : `0b${n.toString(2)}`);
      }
      case 'hex': {
        const n = Math.trunc(toNumber(args[0], line));
        return heap.makeStr(n < 0 ? `-0x${Math.abs(n).toString(16)}` : `0x${n.toString(16)}`);
      }
      case 'oct': {
        const n = Math.trunc(toNumber(args[0], line));
        return heap.makeStr(n < 0 ? `-0o${Math.abs(n).toString(8)}` : `0o${n.toString(8)}`);
      }
      case 'ord': {
        if (args[0].type !== 'str' || String(args[0].val).length !== 1) {
          throw new PyError('TypeError', 'ord() expected a character', line);
        }
        return heap.makeInt(String(args[0].val).charCodeAt(0));
      }
      case 'chr': {
        const code = Math.trunc(toNumber(args[0], line));
        if (code < 0 || code > 0x10ffff) throw new PyError('ValueError', 'chr() arg not in range(0x110000)', line);
        return heap.makeStr(String.fromCodePoint(code));
      }
      case 'isinstance': {
        if (args.length !== 2) throw new PyError('TypeError', 'isinstance expected 2 arguments', line);
        const obj = args[0];
        const targets = args[1].type === 'tuple' ? (args[1].val as PyObj[]) : [args[1]];
        const matchType = targets.some((cls) => {
          if (cls.type === 'NoneType') return obj.type === 'NoneType';
          if (cls.type === 'function') {
            const cname = (cls.val as PyBuiltinVal).name;
            if (cname === 'int' && obj.type === 'bool') return true; // Python: bool subclasses int
            return obj.type === cname;
          }
          return false;
        });
        return heap.makeBool(matchType);
      }
      case 'min':
      case 'max': {
        const items = args.length === 1 ? toIterable(args[0], line) : args;
        if (items.length === 0) throw new PyError('ValueError', `${name}() iterable argument is empty`, line);
        let best = items[0];
        for (const item of items.slice(1)) {
          let cmp = 0;
          if (item.type === 'str' && best.type === 'str') {
            const sa = String(item.val), sb = String(best.val);
            cmp = sa < sb ? -1 : sa > sb ? 1 : 0;
          } else {
            cmp = toNumber(item, line) - toNumber(best, line);
          }
          if ((name === 'min' && cmp < 0) || (name === 'max' && cmp > 0)) best = item;
        }
        return best;
      }
      case 'sum': {
        const items = toIterable(args[0], line);
        let total = args[1] ? toNumber(args[1], line) : 0;
        let hasFloat = false;
        for (const item of items) {
          if (item.type === 'float') hasFloat = true;
          total += toNumber(item, line);
        }
        return hasFloat ? heap.makeFloat(total) : heap.makeInt(total);
      }
      case 'sorted': {
        const items = toIterable(args[0], line);
        const rev = kwargs.reverse ? pyBool(kwargs.reverse) : false;
        const sorted = [...items].sort((a, b) => {
          if (a.type === 'str' && b.type === 'str') {
            const sa = String(a.val), sb = String(b.val);
            return sa < sb ? -1 : sa > sb ? 1 : 0;
          }
          return toNumber(a, line) - toNumber(b, line);
        });
        if (rev) sorted.reverse();
        return heap.makeList(sorted);
      }
      case 'reversed': {
        if (args.length !== 1) throw new PyError('TypeError', 'reversed() takes exactly one argument', line);
        return heap.makeList(toIterable(args[0], line).reverse());
      }
      case 'enumerate': {
        if (args.length < 1) throw new PyError('TypeError', 'enumerate() missing required argument', line);
        const items = toIterable(args[0], line);
        const start = kwargs.start
          ? Math.trunc(toNumber(kwargs.start, line))
          : args[1]
          ? Math.trunc(toNumber(args[1], line))
          : 0;
        return heap.makeList(items.map((item, i) => heap.makeTuple([heap.makeInt(start + i), item])));
      }
      case 'zip': {
        if (args.length === 0) return heap.makeList([]);
        const lists = args.map((a) => toIterable(a, line));
        const minLen = Math.min(...lists.map((l) => l.length));
        const zipped: PyObj[] = [];
        for (let i = 0; i < minLen; i++) {
          zipped.push(heap.makeTuple(lists.map((l) => l[i])));
        }
        return heap.makeList(zipped);
      }
      case 'repr':
        return heap.makeStr(pyRepr(args[0]));
      case 'map': {
        if (args.length < 2) throw new PyError('TypeError', 'map() must have at least two arguments', line);
        const fn = args[0];
        const items = toIterable(args[1], line);
        const fnName = fn.type === 'function' ? (fn.val as PyBuiltinVal).name : '';
        const mapped = items.map((item) => callBuiltin(fnName, [item], {}, line));
        return heap.makeList(mapped);
      }
      case 'math_sqrt':
        return heap.makeFloat(Math.sqrt(toNumber(args[0], line)));
      case 'math_floor':
        return heap.makeInt(Math.floor(toNumber(args[0], line)));
      case 'math_ceil':
        return heap.makeInt(Math.ceil(toNumber(args[0], line)));
      case 'math_fabs':
        return heap.makeFloat(Math.abs(toNumber(args[0], line)));
      case 'math_pow':
        return heap.makeFloat(Math.pow(toNumber(args[0], line), toNumber(args[1], line)));
      case 'math_isnan':
        return heap.makeBool(Number.isNaN(toNumber(args[0], line)));
      case 'math_isinf':
        return heap.makeBool(!Number.isFinite(toNumber(args[0], line)) && !Number.isNaN(toNumber(args[0], line)));
      case 'math_isclose': {
        const a = toNumber(args[0], line);
        const b = toNumber(args[1], line);
        const relTol = kwargs.rel_tol ? toNumber(kwargs.rel_tol, line) : 1e-9;
        const absTol = kwargs.abs_tol ? toNumber(kwargs.abs_tol, line) : 0.0;
        return heap.makeBool(Math.abs(a - b) <= Math.max(relTol * Math.max(Math.abs(a), Math.abs(b)), absTol));
      }
      case 'copy_copy': {
        if (args.length !== 1) throw new PyError('TypeError', 'copy() takes exactly 1 argument', line);
        const x = args[0];
        if (x.type === 'list') return heap.makeList([...(x.val as PyObj[])]);
        if (x.type === 'dict') {
          const map = x.val as Map<string, { key: PyObj; value: PyObj }>;
          return heap.makeDict(Array.from(map.values()).map((e) => [e.key, e.value]));
        }
        if (x.type === 'set') return heap.makeSet([...(x.val as PyObj[])], false);
        if (x.type === 'bytearray') return heap.makeBytes(new Uint8Array(x.val as Uint8Array), true);
        return x;
      }
      case 'copy_deepcopy': {
        if (args.length !== 1) throw new PyError('TypeError', 'deepcopy() takes exactly 1 argument', line);
        const memo = new Map<number, PyObj>();
        const cloneDeep = (obj: PyObj): PyObj => {
          const seen = memo.get(obj.id);
          if (seen) return seen;
          if (obj.type === 'list') {
            const arr: PyObj[] = [];
            const cloned = heap.makeList(arr);
            memo.set(obj.id, cloned);
            for (const el of obj.val as PyObj[]) arr.push(cloneDeep(el));
            return cloned;
          }
          if (obj.type === 'dict') {
            const cloned = heap.makeDict([]);
            memo.set(obj.id, cloned);
            const targetMap = cloned.val as Map<string, { key: PyObj; value: PyObj }>;
            const srcMap = obj.val as Map<string, { key: PyObj; value: PyObj }>;
            for (const entry of srcMap.values()) {
              const nk = cloneDeep(entry.key);
              const nv = cloneDeep(entry.value);
              targetMap.set(pyHashKey(nk), { key: nk, value: nv });
            }
            return cloned;
          }
          if (obj.type === 'set') {
            return heap.makeSet((obj.val as PyObj[]).map(cloneDeep), false);
          }
          if (obj.type === 'bytearray') {
            return heap.makeBytes(new Uint8Array(obj.val as Uint8Array), true);
          }
          if (obj.type === 'tuple') {
            const origItems = obj.val as PyObj[];
            const nextItems = origItems.map(cloneDeep);
            const changed = nextItems.some((item, idx) => item.id !== origItems[idx].id);
            return changed ? heap.makeTuple(nextItems) : obj;
          }
          return obj;
        };
        return cloneDeep(args[0]);
      }
      case 'random_randint': {
        if (args.length !== 2) throw new PyError('TypeError', 'randint() takes 2 arguments', line);
        const lo = Math.trunc(toNumber(args[0], line));
        const hi = Math.trunc(toNumber(args[1], line));
        if (lo > hi) throw new PyError('ValueError', 'empty range for randint()', line);
        return heap.makeInt(lo + Math.floor(Math.random() * (hi - lo + 1)));
      }
      case 'random_choice': {
        if (args.length !== 1) throw new PyError('TypeError', 'choice() takes 1 argument', line);
        const items = toIterable(args[0], line);
        if (items.length === 0) throw new PyError('IndexError', 'cannot choose from an empty sequence', line);
        return items[Math.floor(Math.random() * items.length)];
      }
      default:
        throw new PyError('NameError', `name '${name}' is not defined`, line);
    }
  }

  function callMethod(obj: PyObj, method: string, args: PyObj[], kwargs: Record<string, PyObj>, line: number): PyObj {
    if (obj.type === 'str') {
      const s = String(obj.val);
      const escapeReg = (raw: string) => raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const sliceRange = () => {
        const start = args[1] ? Math.trunc(toNumber(args[1], line)) : 0;
        const end = args[2] ? Math.trunc(toNumber(args[2], line)) : s.length;
        const normStart = start < 0 ? Math.max(0, s.length + start) : Math.min(s.length, start);
        const normEnd = end < 0 ? Math.max(0, s.length + end) : Math.min(s.length, end);
        return { normStart, normEnd };
      };
      switch (method) {
        case 'upper': return heap.makeStr(s.toUpperCase());
        case 'lower': return heap.makeStr(s.toLowerCase());
        case 'casefold': return heap.makeStr(s.toLowerCase());
        case 'swapcase':
          return heap.makeStr(
            Array.from(s)
              .map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
              .join('')
          );
        case 'title': return heap.makeStr(s.replace(/\b\w/g, (c) => c.toUpperCase()));
        case 'capitalize': return heap.makeStr(s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : '');
        case 'strip': {
          if (!args[0]) return heap.makeStr(s.trim());
          const chars = escapeReg(pyStr(args[0]));
          return heap.makeStr(s.replace(new RegExp(`^[${chars}]+|[${chars}]+$`, 'g'), ''));
        }
        case 'lstrip': {
          if (!args[0]) return heap.makeStr(s.trimStart());
          const chars = escapeReg(pyStr(args[0]));
          return heap.makeStr(s.replace(new RegExp(`^[${chars}]+`, 'g'), ''));
        }
        case 'rstrip': {
          if (!args[0]) return heap.makeStr(s.trimEnd());
          const chars = escapeReg(pyStr(args[0]));
          return heap.makeStr(s.replace(new RegExp(`[${chars}]+$`, 'g'), ''));
        }
        case 'removeprefix': {
          const p = pyStr(args[0]);
          return heap.makeStr(s.startsWith(p) ? s.slice(p.length) : s);
        }
        case 'removesuffix': {
          const suf = pyStr(args[0]);
          return heap.makeStr(suf && s.endsWith(suf) ? s.slice(0, s.length - suf.length) : s);
        }
        case 'split': {
          const sep = args[0] && args[0].type !== 'NoneType' ? pyStr(args[0]) : null;
          const maxsplit = args[1] ? Math.trunc(toNumber(args[1], line)) : -1;
          if (sep === '') throw new PyError('ValueError', 'empty separator', line);
          let parts: string[];
          if (sep === null) {
            const trimmed = s.trim();
            if (!trimmed) {
              parts = [];
            } else if (maxsplit >= 0) {
              parts = [];
              let rest = s.trimStart();
              for (let k = 0; k < maxsplit && rest.length > 0; k++) {
                const m = rest.match(/^(\S+)\s+([\s\S]*)$/);
                if (!m) break;
                parts.push(m[1]);
                rest = m[2];
              }
              if (rest.length > 0) parts.push(rest.trimEnd());
            } else {
              parts = trimmed.split(/\s+/);
            }
          } else if (maxsplit >= 0) {
            parts = [];
            let rem = s;
            for (let k = 0; k < maxsplit; k++) {
              const idx = rem.indexOf(sep);
              if (idx === -1) break;
              parts.push(rem.slice(0, idx));
              rem = rem.slice(idx + sep.length);
            }
            parts.push(rem);
          } else {
            parts = s.split(sep);
          }
          return heap.makeList(parts.map((p) => heap.makeStr(p)));
        }
        case 'rsplit': {
          const sep = args[0] && args[0].type !== 'NoneType' ? pyStr(args[0]) : null;
          const maxsplit = args[1] ? Math.trunc(toNumber(args[1], line)) : -1;
          if (sep === '') throw new PyError('ValueError', 'empty separator', line);
          const allParts = sep === null ? (s.trim() ? s.trim().split(/\s+/) : []) : s.split(sep);
          if (maxsplit >= 0 && allParts.length > maxsplit + 1) {
            const cut = allParts.length - maxsplit;
            const head = allParts.slice(0, cut).join(sep ?? ' ');
            return heap.makeList([head, ...allParts.slice(cut)].map((p) => heap.makeStr(p)));
          }
          return heap.makeList(allParts.map((p) => heap.makeStr(p)));
        }
        case 'splitlines': {
          if (!s) return heap.makeList([]);
          const linesOut = s.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n');
          return heap.makeList(linesOut.map((l) => heap.makeStr(l)));
        }
        case 'join': {
          const items = toIterable(args[0], line).map((x) => {
            if (x.type !== 'str') throw new PyError('TypeError', `sequence item: expected str instance, ${x.type} found`, line);
            return String(x.val);
          });
          return heap.makeStr(items.join(s));
        }
        case 'replace': {
          const oldSub = pyStr(args[0]);
          const newSub = pyStr(args[1]);
          if (args[2]) {
            let count = Math.trunc(toNumber(args[2], line));
            let res = '';
            let rem = s;
            while (count > 0) {
              const idx = rem.indexOf(oldSub);
              if (idx === -1) break;
              res += rem.slice(0, idx) + newSub;
              rem = rem.slice(idx + oldSub.length);
              count--;
            }
            return heap.makeStr(res + rem);
          }
          return heap.makeStr(s.split(oldSub).join(newSub));
        }
        case 'startswith': {
          const target = args[0];
          if (target.type === 'tuple') {
            return heap.makeBool((target.val as PyObj[]).some((p) => s.startsWith(pyStr(p))));
          }
          return heap.makeBool(s.startsWith(pyStr(target)));
        }
        case 'endswith': {
          const target = args[0];
          if (target.type === 'tuple') {
            return heap.makeBool((target.val as PyObj[]).some((p) => s.endsWith(pyStr(p))));
          }
          return heap.makeBool(s.endsWith(pyStr(target)));
        }
        case 'find': {
          const sub = pyStr(args[0]);
          const { normStart, normEnd } = sliceRange();
          const idx = s.slice(0, normEnd).indexOf(sub, normStart);
          return heap.makeInt(idx);
        }
        case 'rfind': {
          const sub = pyStr(args[0]);
          const { normStart, normEnd } = sliceRange();
          const subStr = s.slice(normStart, normEnd);
          const idx = subStr.lastIndexOf(sub);
          return heap.makeInt(idx === -1 ? -1 : idx + normStart);
        }
        case 'index': {
          const sub = pyStr(args[0]);
          const { normStart, normEnd } = sliceRange();
          const idx = s.slice(0, normEnd).indexOf(sub, normStart);
          if (idx === -1) throw new PyError('ValueError', 'substring not found', line);
          return heap.makeInt(idx);
        }
        case 'rindex': {
          const sub = pyStr(args[0]);
          const { normStart, normEnd } = sliceRange();
          const subStr = s.slice(normStart, normEnd);
          const idx = subStr.lastIndexOf(sub);
          if (idx === -1) throw new PyError('ValueError', 'substring not found', line);
          return heap.makeInt(idx + normStart);
        }
        case 'count': {
          const sub = pyStr(args[0]);
          const { normStart, normEnd } = sliceRange();
          const target = s.slice(normStart, normEnd);
          if (sub === '') return heap.makeInt(target.length + 1);
          let cnt = 0;
          let pos = 0;
          while ((pos = target.indexOf(sub, pos)) !== -1) {
            cnt++;
            pos += sub.length;
          }
          return heap.makeInt(cnt);
        }
        case 'center': {
          const width = Math.trunc(toNumber(args[0], line));
          const fill = args[1] ? pyStr(args[1])[0] ?? ' ' : ' ';
          if (s.length >= width) return obj;
          const totalPad = width - s.length;
          const left = Math.floor(totalPad / 2);
          return heap.makeStr(fill.repeat(left) + s + fill.repeat(totalPad - left));
        }
        case 'ljust': {
          const width = Math.trunc(toNumber(args[0], line));
          const fill = args[1] ? pyStr(args[1])[0] ?? ' ' : ' ';
          return heap.makeStr(s.length >= width ? s : s + fill.repeat(width - s.length));
        }
        case 'rjust': {
          const width = Math.trunc(toNumber(args[0], line));
          const fill = args[1] ? pyStr(args[1])[0] ?? ' ' : ' ';
          return heap.makeStr(s.length >= width ? s : fill.repeat(width - s.length) + s);
        }
        case 'zfill': {
          const width = Math.trunc(toNumber(args[0], line));
          if (s.length >= width) return obj;
          if (s.startsWith('-') || s.startsWith('+')) {
            return heap.makeStr(s[0] + '0'.repeat(width - s.length) + s.slice(1));
          }
          return heap.makeStr(s.padStart(width, '0'));
        }
        case 'isdigit': return heap.makeBool(s.length > 0 && /^\d+$/.test(s));
        case 'isalpha': return heap.makeBool(s.length > 0 && /^[A-Za-z]+$/.test(s));
        case 'isalnum': return heap.makeBool(s.length > 0 && /^[A-Za-z0-9]+$/.test(s));
        case 'isspace': return heap.makeBool(s.length > 0 && /^\s+$/.test(s));
        case 'isupper': return heap.makeBool(/[A-Z]/.test(s) && s === s.toUpperCase());
        case 'islower': return heap.makeBool(/[a-z]/.test(s) && s === s.toLowerCase());
        case 'istitle': return heap.makeBool(s.length > 0 && s === s.replace(/\b\w+/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()));
        case 'isidentifier': return heap.makeBool(/^[A-Za-z_][A-Za-z0-9_]*$/.test(s));
        case 'encode': return heap.makeBytes(new TextEncoder().encode(s), false);
        case 'format': {
          let autoIdx = 0;
          const out = s.replace(/\{([^{}:]*)(?::([^{}]*))?\}/g, (_full, key: string, spec: string) => {
            let val: PyObj | undefined;
            if (key === '') {
              val = args[autoIdx++];
            } else if (/^\d+$/.test(key)) {
              val = args[parseInt(key, 10)];
            } else {
              val = kwargs[key];
            }
            if (!val) throw new PyError('IndexError', `Replacement index or key '${key}' out of range`, line);
            return spec ? formatWithSpec(val, spec) : pyStr(val);
          });
          return heap.makeStr(out);
        }
      }
    }
    if (obj.type === 'list') {
      const arr = obj.val as PyObj[];
      switch (method) {
        case 'append': arr.push(args[0]); return heap.makeNone();
        case 'extend': arr.push(...toIterable(args[0], line)); return heap.makeNone();
        case 'insert': {
          let idx = Math.trunc(toNumber(args[0], line));
          if (idx < 0) idx = Math.max(0, arr.length + idx);
          idx = Math.min(arr.length, idx);
          arr.splice(idx, 0, args[1]);
          return heap.makeNone();
        }
        case 'pop': {
          if (arr.length === 0) throw new PyError('IndexError', 'pop from empty list', line);
          let idx = args[0] ? Math.trunc(toNumber(args[0], line)) : arr.length - 1;
          if (idx < 0) idx += arr.length;
          if (idx < 0 || idx >= arr.length) throw new PyError('IndexError', 'pop index out of range', line);
          return arr.splice(idx, 1)[0];
        }
        case 'remove': {
          const idx = arr.findIndex((x) => pyEquals(x, args[0]));
          if (idx === -1) throw new PyError('ValueError', 'list.remove(x): x not in list', line);
          arr.splice(idx, 1);
          return heap.makeNone();
        }
        case 'clear': arr.length = 0; return heap.makeNone();
        case 'copy': return heap.makeList([...arr]);
        case 'reverse': arr.reverse(); return heap.makeNone();
        case 'sort': {
          const rev = kwargs.reverse ? pyBool(kwargs.reverse) : false;
          arr.sort((a, b) => {
            if (a.type === 'str' && b.type === 'str') {
              const sa = String(a.val), sb = String(b.val);
              return sa < sb ? -1 : sa > sb ? 1 : 0;
            }
            return toNumber(a, line) - toNumber(b, line);
          });
          if (rev) arr.reverse();
          return heap.makeNone();
        }
        case 'count': return heap.makeInt(arr.filter((x) => pyEquals(x, args[0])).length);
        case 'index': {
          const startRaw = args[1] ? Math.trunc(toNumber(args[1], line)) : 0;
          const endRaw = args[2] ? Math.trunc(toNumber(args[2], line)) : arr.length;
          const normStart = startRaw < 0 ? Math.max(0, arr.length + startRaw) : Math.min(arr.length, startRaw);
          const normEnd = endRaw < 0 ? Math.max(0, arr.length + endRaw) : Math.min(arr.length, endRaw);
          for (let i = normStart; i < normEnd; i++) {
            if (pyEquals(arr[i], args[0])) return heap.makeInt(i);
          }
          throw new PyError('ValueError', `${pyRepr(args[0])} is not in list`, line);
        }
      }
    }
    if (obj.type === 'tuple') {
      const arr = obj.val as PyObj[];
      switch (method) {
        case 'count':
          return heap.makeInt(arr.filter((x) => pyEquals(x, args[0])).length);
        case 'index': {
          const startRaw = args[1] ? Math.trunc(toNumber(args[1], line)) : 0;
          const endRaw = args[2] ? Math.trunc(toNumber(args[2], line)) : arr.length;
          const normStart = startRaw < 0 ? Math.max(0, arr.length + startRaw) : Math.min(arr.length, startRaw);
          const normEnd = endRaw < 0 ? Math.max(0, arr.length + endRaw) : Math.min(arr.length, endRaw);
          for (let i = normStart; i < normEnd; i++) {
            if (pyEquals(arr[i], args[0])) return heap.makeInt(i);
          }
          throw new PyError('ValueError', 'tuple.index(x): x not in tuple', line);
        }
      }
    }
    if (obj.type === 'range') {
      const r = obj.val as PyRangeVal;
      const vals = rangeToArray(r);
      switch (method) {
        case 'count': {
          if (args[0].type !== 'int' && args[0].type !== 'bool') return heap.makeInt(0);
          const target = args[0].type === 'bool' ? (args[0].val ? 1 : 0) : Number(args[0].val);
          return heap.makeInt(vals.includes(target) ? 1 : 0);
        }
        case 'index': {
          if (args[0].type !== 'int' && args[0].type !== 'bool') {
            throw new PyError('ValueError', `${pyRepr(args[0])} is not in range`, line);
          }
          const target = args[0].type === 'bool' ? (args[0].val ? 1 : 0) : Number(args[0].val);
          const idx = vals.indexOf(target);
          if (idx === -1) throw new PyError('ValueError', `${target} is not in range`, line);
          return heap.makeInt(idx);
        }
      }
    }
    if (obj.type === 'dict') {
      const map = obj.val as Map<string, { key: PyObj; value: PyObj }>;
      switch (method) {
        case 'get': {
          const entry = map.get(pyHashKey(args[0]));
          return entry ? entry.value : (args[1] ?? heap.makeNone());
        }
        case 'keys': return heap.makeList(Array.from(map.values()).map((e) => e.key));
        case 'values': return heap.makeList(Array.from(map.values()).map((e) => e.value));
        case 'items':
          return heap.makeList(Array.from(map.values()).map((e) => heap.makeTuple([e.key, e.value])));
        case 'pop': {
          const hk = pyHashKey(args[0]);
          const entry = map.get(hk);
          if (entry) {
            map.delete(hk);
            return entry.value;
          }
          if (args.length >= 2) return args[1];
          throw new PyError('KeyError', pyRepr(args[0]), line);
        }
        case 'popitem': {
          const entries = Array.from(map.entries());
          if (entries.length === 0) throw new PyError('KeyError', 'popitem(): dictionary is empty', line);
          const [lastKey, lastEntry] = entries[entries.length - 1];
          map.delete(lastKey);
          return heap.makeTuple([lastEntry.key, lastEntry.value]);
        }
        case 'setdefault': {
          const hk = pyHashKey(args[0]);
          const existing = map.get(hk);
          if (existing) return existing.value;
          const defVal = args[1] ?? heap.makeNone();
          map.set(hk, { key: args[0], value: defVal });
          return defVal;
        }
        case 'update': {
          if (args[0]) {
            if (args[0].type === 'dict') {
              const src = args[0].val as Map<string, { key: PyObj; value: PyObj }>;
              for (const [k, e] of src.entries()) map.set(k, { key: e.key, value: e.value });
            } else {
              for (const item of toIterable(args[0], line)) {
                const pair = toIterable(item, line);
                if (pair.length !== 2) throw new PyError('ValueError', 'dictionary update sequence element has wrong length', line);
                map.set(pyHashKey(pair[0]), { key: pair[0], value: pair[1] });
              }
            }
          }
          for (const [k, v] of Object.entries(kwargs)) {
            const keyObj = heap.makeStr(k);
            map.set(pyHashKey(keyObj), { key: keyObj, value: v });
          }
          return heap.makeNone();
        }
        case 'copy': return heap.makeDict(Array.from(map.values()).map((e) => [e.key, e.value]));
        case 'clear': map.clear(); return heap.makeNone();
      }
    }
    if (obj.type === 'set' || obj.type === 'frozenset') {
      const arr = obj.val as PyObj[];
      const isFrozen = obj.type === 'frozenset';
      const setKeys = (items: PyObj[]) => new Set(items.map(pyHashKey));
      switch (method) {
        case 'union': {
          const combined = [...arr];
          for (const other of args) combined.push(...toIterable(other, line));
          return heap.makeSet(combined, isFrozen);
        }
        case 'intersection': {
          let current = [...arr];
          for (const other of args) {
            const keys = setKeys(toIterable(other, line));
            current = current.filter((x) => keys.has(pyHashKey(x)));
          }
          return heap.makeSet(current, isFrozen);
        }
        case 'difference': {
          let current = [...arr];
          for (const other of args) {
            const keys = setKeys(toIterable(other, line));
            current = current.filter((x) => !keys.has(pyHashKey(x)));
          }
          return heap.makeSet(current, isFrozen);
        }
        case 'symmetric_difference': {
          const otherItems = toIterable(args[0], line);
          const aKeys = setKeys(arr);
          const bKeys = setKeys(otherItems);
          return heap.makeSet(
            [...arr.filter((x) => !bKeys.has(pyHashKey(x))), ...otherItems.filter((x) => !aKeys.has(pyHashKey(x)))],
            isFrozen
          );
        }
        case 'issubset': {
          const bKeys = setKeys(toIterable(args[0], line));
          return heap.makeBool(arr.every((x) => bKeys.has(pyHashKey(x))));
        }
        case 'issuperset': {
          const aKeys = setKeys(arr);
          return heap.makeBool(toIterable(args[0], line).every((x) => aKeys.has(pyHashKey(x))));
        }
        case 'isdisjoint': {
          const aKeys = setKeys(arr);
          return heap.makeBool(!toIterable(args[0], line).some((x) => aKeys.has(pyHashKey(x))));
        }
        case 'copy': return heap.makeSet([...arr], isFrozen);
      }
      if (!isFrozen) {
        switch (method) {
          case 'add': {
            const k = pyHashKey(args[0]);
            if (!arr.some((x) => pyHashKey(x) === k)) arr.push(args[0]);
            return heap.makeNone();
          }
          case 'remove': {
            const k = pyHashKey(args[0]);
            const idx = arr.findIndex((x) => pyHashKey(x) === k);
            if (idx === -1) throw new PyError('KeyError', pyRepr(args[0]), line);
            arr.splice(idx, 1);
            return heap.makeNone();
          }
          case 'discard': {
            const k = pyHashKey(args[0]);
            const idx = arr.findIndex((x) => pyHashKey(x) === k);
            if (idx !== -1) arr.splice(idx, 1);
            return heap.makeNone();
          }
          case 'pop': {
            if (arr.length === 0) throw new PyError('KeyError', 'pop from an empty set', line);
            return arr.shift()!;
          }
          case 'clear':
            arr.length = 0;
            return heap.makeNone();
          case 'update': {
            for (const other of args) {
              for (const item of toIterable(other, line)) {
                const k = pyHashKey(item);
                if (!arr.some((x) => pyHashKey(x) === k)) arr.push(item);
              }
            }
            return heap.makeNone();
          }
        }
      }
    }
    if (obj.type === 'bytes' || obj.type === 'bytearray') {
      const arr = obj.val as Uint8Array;
      const isMutable = obj.type === 'bytearray';
      const asLatin = (u: Uint8Array) => Array.from(u).map((b) => String.fromCharCode(b)).join('');
      const fromLatin = (s: string) => Uint8Array.from(Array.from(s).map((c) => c.charCodeAt(0) & 0xff));
      switch (method) {
        case 'decode':
          return heap.makeStr(new TextDecoder().decode(arr));
        case 'hex':
          return heap.makeStr(Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join(''));
        case 'upper':
          return heap.makeBytes(fromLatin(asLatin(arr).toUpperCase()), isMutable);
        case 'lower':
          return heap.makeBytes(fromLatin(asLatin(arr).toLowerCase()), isMutable);
        case 'strip':
          return heap.makeBytes(fromLatin(asLatin(arr).trim()), isMutable);
        case 'split': {
          const sep = args[0] ? asLatin(args[0].val as Uint8Array) : null;
          const parts = sep === null ? (asLatin(arr).trim() ? asLatin(arr).trim().split(/\s+/) : []) : asLatin(arr).split(sep);
          return heap.makeList(parts.map((p) => heap.makeBytes(fromLatin(p), isMutable)));
        }
        case 'replace': {
          const oldB = asLatin(args[0].val as Uint8Array);
          const newB = asLatin(args[1].val as Uint8Array);
          return heap.makeBytes(fromLatin(asLatin(arr).split(oldB).join(newB)), isMutable);
        }
        case 'startswith':
          return heap.makeBool(asLatin(arr).startsWith(asLatin(args[0].val as Uint8Array)));
        case 'endswith':
          return heap.makeBool(asLatin(arr).endsWith(asLatin(args[0].val as Uint8Array)));
        case 'find':
          return heap.makeInt(asLatin(arr).indexOf(asLatin(args[0].val as Uint8Array)));
        case 'count': {
          if (args[0].type === 'int' || args[0].type === 'bool') {
            const target = Math.trunc(toNumber(args[0], line));
            return heap.makeInt(Array.from(arr).filter((b) => b === target).length);
          }
          const sub = asLatin(args[0].val as Uint8Array);
          const hay = asLatin(arr);
          if (!sub) return heap.makeInt(hay.length + 1);
          let cnt = 0, pos = 0;
          while ((pos = hay.indexOf(sub, pos)) !== -1) {
            cnt++;
            pos += sub.length;
          }
          return heap.makeInt(cnt);
        }
        case 'copy':
          return heap.makeBytes(new Uint8Array(arr), isMutable);
      }
      if (isMutable) {
        switch (method) {
          case 'append': {
            const b = Math.trunc(toNumber(args[0], line));
            if (b < 0 || b > 255) throw new PyError('ValueError', 'byte must be in range(0, 256)', line);
            const next = new Uint8Array(arr.length + 1);
            next.set(arr, 0);
            next[arr.length] = b;
            obj.val = next;
            return heap.makeNone();
          }
          case 'extend': {
            const extra = toIterable(args[0], line).map((x) => {
              const b = Math.trunc(toNumber(x, line));
              if (b < 0 || b > 255) throw new PyError('ValueError', 'byte must be in range(0, 256)', line);
              return b;
            });
            const next = new Uint8Array(arr.length + extra.length);
            next.set(arr, 0);
            next.set(extra, arr.length);
            obj.val = next;
            return heap.makeNone();
          }
          case 'pop': {
            if (arr.length === 0) throw new PyError('IndexError', 'pop from empty bytearray', line);
            let idx = args[0] ? Math.trunc(toNumber(args[0], line)) : arr.length - 1;
            if (idx < 0) idx += arr.length;
            if (idx < 0 || idx >= arr.length) throw new PyError('IndexError', 'pop index out of range', line);
            const popped = arr[idx];
            const next = new Uint8Array(arr.length - 1);
            next.set(arr.slice(0, idx), 0);
            next.set(arr.slice(idx + 1), idx);
            obj.val = next;
            return heap.makeInt(popped);
          }
          case 'clear':
            obj.val = new Uint8Array(0);
            return heap.makeNone();
          case 'reverse':
            arr.reverse();
            return heap.makeNone();
        }
      }
    }
    if (obj.type === 'int' || obj.type === 'bool') {
      const n = Math.abs(obj.type === 'bool' ? (obj.val ? 1 : 0) : Math.trunc(Number(obj.val)));
      switch (method) {
        case 'bit_length':
          return heap.makeInt(n === 0 ? 0 : n.toString(2).length);
        case 'conjugate':
          return heap.makeInt(obj.type === 'bool' ? (obj.val ? 1 : 0) : Number(obj.val));
        case 'to_bytes': {
          const length = args[0] ? Math.trunc(toNumber(args[0], line)) : 1;
          const order = args[1] ? pyStr(args[1]) : 'big';
          const out = new Uint8Array(Math.max(0, length));
          let rem = obj.type === 'bool' ? (obj.val ? 1 : 0) : Math.trunc(Number(obj.val));
          for (let i = 0; i < out.length; i++) {
            const idx = order === 'little' ? i : out.length - 1 - i;
            out[idx] = rem & 0xff;
            rem >>= 8;
          }
          return heap.makeBytes(out, false);
        }
      }
    }
    if (obj.type === 'float') {
      const n = Number(obj.val);
      switch (method) {
        case 'is_integer':
          return heap.makeBool(Number.isFinite(n) && Number.isInteger(n));
        case 'conjugate':
          return obj;
        case 'as_integer_ratio': {
          if (!Number.isFinite(n)) throw new PyError('OverflowError', 'cannot convert Infinity/NaN to integer ratio', line);
          if (Number.isInteger(n)) return heap.makeTuple([heap.makeInt(n), heap.makeInt(1)]);
          let den = 1;
          let num = n;
          for (let k = 0; k < 24 && Math.abs(num - Math.round(num)) > 1e-12; k++) {
            num *= 2;
            den *= 2;
          }
          num = Math.round(num);
          const gcd = (x: number, y: number): number => (y === 0 ? Math.abs(x) : gcd(y, x % y));
          const g = gcd(num, den) || 1;
          return heap.makeTuple([heap.makeInt(num / g), heap.makeInt(den / g)]);
        }
      }
    }
    if (obj.type === 'complex') {
      const c = obj.val as PyComplexVal;
      if (method === 'conjugate') {
        return heap.makeComplex(c.real, -c.imag);
      }
    }
    throw new PyError('AttributeError', `'${obj.type}' object has no attribute '${method}'`, line);
  }

  function describeTarget(t: TargetNode): string {
    if (t.kind === 'NameTarget') return t.name;
    if (t.kind === 'StarTarget') return `*${describeTarget(t.target)}`;
    if (t.kind === 'TupleTarget') return t.elements.map(describeTarget).join(', ');
    if (t.kind === 'SubscriptTarget' || t.kind === 'SubscriptSliceTarget') {
      return t.object.kind === 'Name' ? `${t.object.name}[...]` : 'container[...]';
    }
    return 'item';
  }

  function* execBlock(stmts: StmtNode[], env: Map<string, PyObj>, emitSteps = true): StmtGen {
    for (const stmt of stmts) {
      const sig = yield* execStmt(stmt, env, emitSteps);
      if (sig) return sig;
    }
  }

  function* execStmt(stmt: StmtNode, env: Map<string, PyObj>, emitSteps = true): StmtGen {
    const prevIds = snapshotVarIds(env);
    const outBefore = outputSoFar;
    const errBefore = stderrSoFar;

    switch (stmt.kind) {
      case 'Pass': {
        if (emitSteps) {
          const trace = emitStep(stmt.line, env, prevIds, `Line ${stmt.line}: pass — Python does nothing here and moves on.`, 'pass is a placeholder statement when Python expects an indented line.', 'control');
          yield { kind: 'step', trace };
        }
        return;
      }
      case 'Break':
        return new ControlSignal('break');
      case 'Continue':
        return new ControlSignal('continue');
      case 'Return': {
        const val = stmt.value ? yield* evalExpr(stmt.value, env) : heap.makeNone();
        return new ControlSignal('return', val);
      }
      case 'Import': {
        for (const item of stmt.names) {
          const bindName = item.alias || item.module;
          if (!stmt.fromModule && item.module === 'sys') {
            env.set(
              bindName,
              heap.makeModule('sys', {
                stdout: heap.makeStr('<sys.stdout>'),
                stderr: heap.makeStr('<sys.stderr>'),
              })
            );
          } else if (!stmt.fromModule && item.module === 'math') {
            env.set(
              bindName,
              heap.makeModule('math', {
                pi: heap.makeFloat(Math.PI),
                e: heap.makeFloat(Math.E),
                sqrt: heap.makeBuiltin('math_sqrt'),
                floor: heap.makeBuiltin('math_floor'),
                ceil: heap.makeBuiltin('math_ceil'),
                fabs: heap.makeBuiltin('math_fabs'),
                pow: heap.makeBuiltin('math_pow'),
                isnan: heap.makeBuiltin('math_isnan'),
                isinf: heap.makeBuiltin('math_isinf'),
                isclose: heap.makeBuiltin('math_isclose'),
              })
            );
          } else if (!stmt.fromModule && item.module === 'copy') {
            env.set(
              bindName,
              heap.makeModule('copy', {
                copy: heap.makeBuiltin('copy_copy'),
                deepcopy: heap.makeBuiltin('copy_deepcopy'),
              })
            );
          } else if (!stmt.fromModule && item.module === 'random') {
            env.set(
              bindName,
              heap.makeModule('random', {
                randint: heap.makeBuiltin('random_randint'),
                choice: heap.makeBuiltin('random_choice'),
              })
            );
          } else if (stmt.fromModule === 'random') {
            if (item.module === 'randint') env.set(bindName, heap.makeBuiltin('random_randint'));
            else if (item.module === 'choice') env.set(bindName, heap.makeBuiltin('random_choice'));
          } else if (stmt.fromModule === 'copy') {
            if (item.module === 'copy') env.set(bindName, heap.makeBuiltin('copy_copy'));
            else if (item.module === 'deepcopy') env.set(bindName, heap.makeBuiltin('copy_deepcopy'));
          } else if (stmt.fromModule === 'math') {
            if (item.module === 'pi') env.set(bindName, heap.makeFloat(Math.PI));
            else if (item.module === 'e') env.set(bindName, heap.makeFloat(Math.E));
            else if (['sqrt', 'floor', 'ceil', 'fabs', 'pow', 'isnan', 'isinf', 'isclose'].includes(item.module)) {
              env.set(bindName, heap.makeBuiltin(`math_${item.module}`));
            }
          }
        }
        if (emitSteps) {
          const mods = stmt.names.map((n) => n.module).join(', ');
          const trace = emitStep(stmt.line, env, prevIds, `Line ${stmt.line}: Imported ${mods} so its tools are ready to use.`, `Python loads the ${mods} module into memory.`, 'control');
          yield { kind: 'step', trace };
        }
        return;
      }
      case 'Assign': {
        const value = yield* evalExpr(stmt.value, env);
        const allGroups = stmt.targets;
        for (const group of allGroups) {
          for (const tgt of group) {
            yield* bindTarget(tgt, value, env);
          }
        }

        if (emitSteps) {
          let narration = '';
          let explainMore = '';
          let kind: TraceStep['eventKind'] = 'assign';

          const flatTargets = allGroups.flat();
          if (allGroups.length > 1) {
            const names = flatTargets.map(describeTarget).join(', ');
            kind = 'alias';
            narration = `Line ${stmt.line}: Python points ${names} to the exact same ${value.type} object (${pyRepr(value)}) with id ${value.id}.`;
            explainMore = `Chained assignment (= ... =) evaluates the right-hand value once and attaches multiple name tags to that single object in memory.`;
          } else if (flatTargets.length === 1 && flatTargets[0].kind === 'TupleTarget') {
            const names = flatTargets[0].elements.map(describeTarget);
            const isSwap =
              stmt.value.kind === 'Tuple' &&
              stmt.value.elements.every((e) => e.kind === 'Name') &&
              names.every((n) => stmt.value.kind === 'Tuple' && stmt.value.elements.some((e) => e.kind === 'Name' && e.name === n));
            kind = isSwap ? 'swap' : 'unpack';
            narration = isSwap
              ? `Line ${stmt.line}: Swapped ${names.join(' and ')} cleanly in one step — Python evaluated the right side first before reattaching the tags.`
              : `Line ${stmt.line}: Unpacked ${pyRepr(value)} into ${names.join(', ')}.`;
            explainMore = isSwap
              ? 'Because Python builds the right-hand tuple before binding the left-hand names, swapping needs no temporary third variable!'
              : 'Tuple/list unpacking matches each item on the right to each name on the left (and * collects any leftovers into a list).';
          } else if (flatTargets.length === 1 && (flatTargets[0].kind === 'SubscriptTarget' || flatTargets[0].kind === 'SubscriptSliceTarget')) {
            const containerName = flatTargets[0].object.kind === 'Name' ? flatTargets[0].object.name : 'container';
            const containerObj = env.get(containerName);
            kind = 'reassign';
            narration = `Line ${stmt.line}: Mutated "${containerName}" in place — now ${containerObj ? pyRepr(containerObj) : pyRepr(value)} (same id ${containerObj?.id ?? ''}).`;
            explainMore = `Lists and dicts are mutable! Changing an item or slice modifies the existing container in memory without creating a brand-new object ID.`;
          } else {
            const targetName = describeTarget(flatTargets[0]);
            const hadBefore = prevIds.has(targetName);
            const oldId = prevIds.get(targetName);
            const isAliasAssign = stmt.value.kind === 'Name';
            if (isAliasAssign) {
              kind = 'alias';
              narration = `Line ${stmt.line}: "${targetName}" now points to the same ${value.type} object (${pyRepr(value)}) as "${(stmt.value as { name: string }).name}".`;
              explainMore = `No copy was made! Both names share object id ${value.id}.`;
            } else if (hadBefore) {
              kind = 'reassign';
              narration = `Line ${stmt.line}: Moved the "${targetName}" tag to ${pyRepr(value)} (${value.type}). Its memory id changed from ${oldId} to ${value.id}.`;
              explainMore = `Reassigning doesn't overwrite the old number or text — Python creates or finds the new ${value.type} object and moves the "${targetName}" name tag onto it.`;
            } else {
              kind = 'assign';
              narration = `Line ${stmt.line}: Created tag "${targetName}" and attached it to ${pyRepr(value)} (type ${value.type}, id ${value.id}).`;
              explainMore = `Python needs no keyword like "var" or "int". Writing ${targetName} = ... creates the name tag and links it to the object in memory.`;
            }
          }

          const trace = emitStep(stmt.line, env, prevIds, narration, explainMore, kind);
          if (flatTargets.length === 1 && (flatTargets[0].kind === 'SubscriptTarget' || flatTargets[0].kind === 'SubscriptSliceTarget') && flatTargets[0].object.kind === 'Name') {
            const cName = flatTargets[0].object.name;
            if (!trace.changedNames.includes(cName)) trace.changedNames.push(cName);
            const vEntry = trace.variables.find((v) => v.name === cName);
            if (vEntry) vEntry.changed = true;
          }
          yield { kind: 'step', trace };
        }
        return;
      }
      case 'AugAssign': {
        const rightVal = yield* evalExpr(stmt.value, env);
        const baseOp = stmt.op.slice(0, -1);
        if (stmt.target.kind === 'NameTarget') {
          const tName = stmt.target.name;
          const cur = lookupName(tName, env, stmt.line);
          if (cur.type === 'list' && stmt.op === '+=') {
            (cur.val as PyObj[]).push(...toIterable(rightVal, stmt.line));
            if (emitSteps) {
              const trace = emitStep(
                stmt.line,
                env,
                prevIds,
                `Line ${stmt.line}: Extended list "${tName}" in place with += — now ${pyRepr(cur)} (same id ${cur.id}).`,
                `For a mutable list, += modifies the existing list in place like .extend(), so any alias sees the update too!`,
                'reassign'
              );
              if (!trace.changedNames.includes(tName)) trace.changedNames.push(tName);
              const vEntry = trace.variables.find((v) => v.name === tName);
              if (vEntry) vEntry.changed = true;
              yield { kind: 'step', trace };
            }
            return;
          }
          const nextVal = applyBinary(baseOp, cur, rightVal, stmt.line);
          env.set(stmt.target.name, nextVal);
          if (emitSteps) {
            const trace = emitStep(
              stmt.line,
              env,
              prevIds,
              `Line ${stmt.line}: Updated "${stmt.target.name}" with ${stmt.op} ${pyRepr(rightVal)} — now ${pyRepr(nextVal)} (${nextVal.type}).`,
              `${stmt.target.name} ${stmt.op} ... is shorthand for ${stmt.target.name} = ${stmt.target.name} ${baseOp} ....`,
              'reassign'
            );
            yield { kind: 'step', trace };
          }
        }
        return;
      }
      case 'Del': {
        const deleted: string[] = [];
        for (const t of stmt.targets) {
          if (t.kind === 'NameTarget') {
            if (!env.has(t.name)) {
              throw new PyError('NameError', `name '${t.name}' is not defined`, stmt.line);
            }
            env.delete(t.name);
            deleted.push(t.name);
          } else if (t.kind === 'SubscriptTarget') {
            const obj = yield* evalExpr(t.object, env);
            const idx = yield* evalExpr(t.index, env);
            if (obj.type === 'list') {
              const arr = obj.val as PyObj[];
              let i = Math.trunc(toNumber(idx, stmt.line));
              if (i < 0) i += arr.length;
              if (i < 0 || i >= arr.length) throw new PyError('IndexError', 'list assignment index out of range', stmt.line);
              arr.splice(i, 1);
            } else if (obj.type === 'dict') {
              const map = obj.val as Map<string, { key: PyObj; value: PyObj }>;
              const hk = pyHashKey(idx);
              if (!map.has(hk)) throw new PyError('KeyError', pyRepr(idx), stmt.line);
              map.delete(hk);
            } else {
              throw new PyError('TypeError', `'${obj.type}' object does not support item deletion`, stmt.line);
            }
          } else if (t.kind === 'SubscriptSliceTarget') {
            const obj = yield* evalExpr(t.object, env);
            if (obj.type !== 'list') {
              throw new PyError('TypeError', `'${obj.type}' object does not support slice deletion`, stmt.line);
            }
            const arr = obj.val as PyObj[];
            const len = arr.length;
            let start = t.lower ? Math.trunc(toNumber(yield* evalExpr(t.lower, env), stmt.line)) : 0;
            let stop = t.upper ? Math.trunc(toNumber(yield* evalExpr(t.upper, env), stmt.line)) : len;
            if (start < 0) start += len;
            if (stop < 0) stop += len;
            start = Math.max(0, Math.min(start, len));
            stop = Math.max(start, Math.min(stop, len));
            arr.splice(start, stop - start);
          }
        }
        if (emitSteps) {
          const msg = deleted.length > 0
            ? `Line ${stmt.line}: Removed name tag ${deleted.map((n) => `"${n}"`).join(', ')} with del. Using it later will raise NameError.`
            : `Line ${stmt.line}: Deleted item(s) in place using del.`;
          const trace = emitStep(
            stmt.line,
            env,
            prevIds,
            msg,
            'del removes a variable label or deletes items from a mutable container like a list or dict.',
            'del',
            '',
            '',
            deleted
          );
          yield { kind: 'step', trace };
        }
        return;
      }
      case 'ExprStmt': {
        const val = yield* evalExpr(stmt.expr, env);
        const outDelta = outputSoFar.slice(outBefore.length);
        const errDelta = stderrSoFar.slice(errBefore.length);
        if (emitSteps) {
          const isPrint = outDelta.length > 0 || errDelta.length > 0;
          const isInput = stmt.expr.kind === 'Call' && stmt.expr.func.kind === 'Name' && stmt.expr.func.name === 'input';
          const isMutatingAttr =
            stmt.expr.kind === 'Call' &&
            stmt.expr.func.kind === 'Attribute' &&
            stmt.expr.func.object.kind === 'Name' &&
            ['append', 'extend', 'insert', 'pop', 'remove', 'clear', 'reverse', 'sort', 'update', 'popitem', 'setdefault', 'add', 'discard'].includes(stmt.expr.func.attr);
          const mutatedName =
            isMutatingAttr && stmt.expr.kind === 'Call' && stmt.expr.func.kind === 'Attribute' && stmt.expr.func.object.kind === 'Name'
              ? stmt.expr.func.object.name
              : null;
          const mutatedMethod =
            isMutatingAttr && stmt.expr.kind === 'Call' && stmt.expr.func.kind === 'Attribute'
              ? stmt.expr.func.attr
              : '';
          const mutatedObj = mutatedName ? env.get(mutatedName) : undefined;
          const narration = isPrint
            ? `Line ${stmt.line}: Printed ${JSON.stringify(outDelta.replace(/\n$/, ''))} to the console.`
            : isInput
            ? `Line ${stmt.line}: Collected text input from the learner.`
            : mutatedName && mutatedObj
            ? `Line ${stmt.line}: Mutated "${mutatedName}" in place with .${mutatedMethod}() — now ${pyRepr(mutatedObj)} (same id ${mutatedObj.id}).`
            : `Line ${stmt.line}: Evaluated expression -> ${pyRepr(val)} (${val.type}).`;
          const explainMore = isPrint
            ? 'print() converts each argument to text with str(), joins them with sep, and ends with end.'
            : mutatedName
            ? `This method changed the ${mutatedObj?.type ?? 'container'} right inside memory without moving its name tag or changing its object ID.`
            : 'An expression was evaluated and returned a value.';
          const trace = emitStep(stmt.line, env, prevIds, narration, explainMore, isPrint ? 'print' : 'expr', outDelta, errDelta);
          if (mutatedName) {
            if (!trace.changedNames.includes(mutatedName)) trace.changedNames.push(mutatedName);
            const vEntry = trace.variables.find((v) => v.name === mutatedName);
            if (vEntry) vEntry.changed = true;
          }
          yield { kind: 'step', trace };
        }
        return;
      }
      case 'If': {
        let taken = false;
        for (const br of stmt.branches) {
          const cond = yield* evalExpr(br.test, env);
          if (pyBool(cond)) {
            if (emitSteps) {
              const trace = emitStep(stmt.line, env, prevIds, `Line ${stmt.line}: Condition was True, so Python enters this branch.`, 'if checks whether the condition evaluates to True.', 'control');
              yield { kind: 'step', trace };
            }
            const sig = yield* execBlock(br.body, env, emitSteps);
            taken = true;
            if (sig) return sig;
            break;
          }
        }
        if (!taken && stmt.elseBody.length > 0) {
          if (emitSteps) {
            const trace = emitStep(stmt.line, env, prevIds, `Line ${stmt.line}: Condition was False, so Python runs the else branch.`, 'else runs when none of the earlier if/elif conditions matched.', 'control');
            yield { kind: 'step', trace };
          }
          const sig = yield* execBlock(stmt.elseBody, env, emitSteps);
          if (sig) return sig;
        }
        return;
      }
      case 'While': {
        while (true) {
          const cond = yield* evalExpr(stmt.test, env);
          if (!pyBool(cond)) break;
          if (emitSteps) {
            const trace = emitStep(stmt.line, env, prevIds, `Line ${stmt.line}: while condition is True — running loop body.`, 'while repeats its block as long as the condition stays True.', 'control');
            yield { kind: 'step', trace };
          }
          const sig = yield* execBlock(stmt.body, env, emitSteps);
          if (sig?.kind === 'break') break;
          if (sig?.kind === 'return') return sig;
        }
        return;
      }
      case 'For': {
        const iterObj = yield* evalExpr(stmt.iter, env);
        const items = toIterable(iterObj, stmt.line);
        for (const item of items) {
          yield* bindTarget(stmt.target, item, env);
          if (emitSteps) {
            const trace = emitStep(stmt.line, env, prevIds, `Line ${stmt.line}: Loop picks next item ${pyRepr(item)} (${item.type}).`, 'for loops walk through each element of a sequence one by one.', 'control');
            yield { kind: 'step', trace };
          }
          const sig = yield* execBlock(stmt.body, env, emitSteps);
          if (sig?.kind === 'break') break;
          if (sig?.kind === 'return') return sig;
        }
        return;
      }
      case 'Def': {
        const fnObj = heap.makeFunction({
          name: stmt.name,
          params: stmt.params,
          body: stmt.body,
          closure: env,
        });
        env.set(stmt.name, fnObj);
        if (emitSteps) {
          const trace = emitStep(stmt.line, env, prevIds, `Line ${stmt.line}: Defined function ${stmt.name}(${stmt.params.join(', ')}).`, 'def stores a reusable function in memory; it runs when called.', 'assign');
          yield { kind: 'step', trace };
        }
        return;
      }
      case 'Try': {
        try {
          const sig = yield* execBlock(stmt.body, env, emitSteps);
          if (sig) return sig;
        } catch (err) {
          if (err instanceof PyError) {
            let handled = false;
            for (const h of stmt.handlers) {
              if (!h.excType || h.excType === err.errorType || h.excType === 'Exception') {
                if (h.alias) env.set(h.alias, heap.makeStr(err.message));
                if (emitSteps) {
                  const trace = emitStep(stmt.line, env, prevIds, `Line ${stmt.line}: Caught ${err.errorType} safely in except block.`, 'try/except prevents the program from crashing when an expected error occurs.', 'control');
                  yield { kind: 'step', trace };
                }
                const sig = yield* execBlock(h.body, env, emitSteps);
                handled = true;
                if (sig) return sig;
                break;
              }
            }
            if (!handled) throw err;
          } else {
            throw err;
          }
        } finally {
          if (stmt.finallyBody.length > 0) {
            yield* execBlock(stmt.finallyBody, env, emitSteps);
          }
        }
        return;
      }
      case 'Raise': {
        const EXC_NAMES = new Set([
          'ValueError',
          'TypeError',
          'KeyError',
          'IndexError',
          'AttributeError',
          'ZeroDivisionError',
          'NameError',
          'SyntaxError',
          'RuntimeError',
          'Exception',
        ]);
        if (stmt.message?.kind === 'Call' && stmt.message.func.kind === 'Name' && EXC_NAMES.has(stmt.message.func.name)) {
          const excName = stmt.message.func.name;
          const argVal = stmt.message.args[0] ? yield* evalExpr(stmt.message.args[0], env) : null;
          throw new PyError(excName, argVal ? pyStr(argVal) : excName, stmt.line);
        }
        if (stmt.message?.kind === 'Name' && EXC_NAMES.has(stmt.message.name)) {
          throw new PyError(stmt.message.name, stmt.message.name, stmt.line);
        }
        const msgObj = stmt.message ? yield* evalExpr(stmt.message, env) : null;
        throw new PyError('RuntimeError', msgObj ? pyStr(msgObj) : 'raised error', stmt.line);
      }
    }
  }

  try {
    const ast = parsePython(source);
    yield* execBlock(ast, globals, true);
    yield {
      kind: 'done',
      steps,
      finalOutput: outputSoFar,
      finalStderr: stderrSoFar,
    };
  } catch (err) {
    if (err instanceof PyError) {
      const friendly = translatePythonError(err.errorType, err.message, err.line);
      yield {
        kind: 'error',
        error: friendly,
        steps,
        finalOutput: outputSoFar,
      };
      return;
    }
    const friendly = translatePythonError('RuntimeError', err instanceof Error ? err.message : String(err), 1);
    yield {
      kind: 'error',
      error: friendly,
      steps,
      finalOutput: outputSoFar,
    };
  }
}
