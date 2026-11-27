import { PyObjectSnapshot, PyTypeName } from '../types/lab';

export class PyError extends Error {
  errorType: string;
  line: number;

  constructor(errorType: string, message: string, line = 1) {
    super(message);
    this.errorType = errorType;
    this.line = line;
  }
}

export interface PyFunctionVal {
  name: string;
  params: string[];
  body: unknown[]; // ASTStmt[]
  closure: Map<string, PyObj>;
}

export interface PyBuiltinVal {
  name: string;
}

export interface PyRangeVal {
  start: number;
  stop: number;
  step: number;
}

export interface PyComplexVal {
  real: number;
  imag: number;
}

export interface PyModuleVal {
  name: string;
  attrs: Record<string, PyObj>;
}

export type PyValue =
  | number
  | boolean
  | string
  | null
  | PyObj[]
  | Map<string, { key: PyObj; value: PyObj }>
  | PyComplexVal
  | PyRangeVal
  | PyFunctionVal
  | PyBuiltinVal
  | PyModuleVal
  | Uint8Array;

export class PyObj {
  id: number;
  type: PyTypeName;
  mutable: boolean;
  val: PyValue;

  constructor(id: number, type: PyTypeName, val: PyValue, mutable: boolean) {
    this.id = id;
    this.type = type;
    this.val = val;
    this.mutable = mutable;
  }
}

export class MemoryHeap {
  private nextId = 14023488000;
  private objects = new Map<number, PyObj>();
  private smallIntPool = new Map<number, PyObj>();
  private boolTrue: PyObj | null = null;
  private boolFalse: PyObj | null = null;
  private noneObj: PyObj | null = null;

  allocId(): number {
    this.nextId += 32;
    return this.nextId;
  }

  makeInt(n: number): PyObj {
    const intVal = Math.trunc(n);
    if (intVal >= -5 && intVal <= 256) {
      const cached = this.smallIntPool.get(intVal);
      if (cached) return cached;
      const obj = new PyObj(this.allocId(), 'int', intVal, false);
      this.smallIntPool.set(intVal, obj);
      this.objects.set(obj.id, obj);
      return obj;
    }
    const obj = new PyObj(this.allocId(), 'int', intVal, false);
    this.objects.set(obj.id, obj);
    return obj;
  }

  makeFloat(n: number): PyObj {
    const obj = new PyObj(this.allocId(), 'float', n, false);
    this.objects.set(obj.id, obj);
    return obj;
  }

  makeComplex(real: number, imag: number): PyObj {
    const obj = new PyObj(this.allocId(), 'complex', { real, imag }, false);
    this.objects.set(obj.id, obj);
    return obj;
  }

  makeBool(b: boolean): PyObj {
    if (b) {
      if (!this.boolTrue) {
        this.boolTrue = new PyObj(this.allocId(), 'bool', true, false);
        this.objects.set(this.boolTrue.id, this.boolTrue);
      }
      return this.boolTrue;
    }
    if (!this.boolFalse) {
      this.boolFalse = new PyObj(this.allocId(), 'bool', false, false);
      this.objects.set(this.boolFalse.id, this.boolFalse);
    }
    return this.boolFalse;
  }

  makeNone(): PyObj {
    if (!this.noneObj) {
      this.noneObj = new PyObj(this.allocId(), 'NoneType', null, false);
      this.objects.set(this.noneObj.id, this.noneObj);
    }
    return this.noneObj;
  }

  makeStr(s: string): PyObj {
    const obj = new PyObj(this.allocId(), 'str', s, false);
    this.objects.set(obj.id, obj);
    return obj;
  }

  makeList(items: PyObj[]): PyObj {
    const obj = new PyObj(this.allocId(), 'list', items, true);
    this.objects.set(obj.id, obj);
    return obj;
  }

  makeTuple(items: PyObj[]): PyObj {
    const obj = new PyObj(this.allocId(), 'tuple', items, false);
    this.objects.set(obj.id, obj);
    return obj;
  }

  makeRange(start: number, stop: number, step: number): PyObj {
    const obj = new PyObj(this.allocId(), 'range', { start, stop, step }, false);
    this.objects.set(obj.id, obj);
    return obj;
  }

  makeDict(entries: Array<[PyObj, PyObj]>): PyObj {
    const map = new Map<string, { key: PyObj; value: PyObj }>();
    for (const [k, v] of entries) {
      map.set(pyHashKey(k), { key: k, value: v });
    }
    const obj = new PyObj(this.allocId(), 'dict', map, true);
    this.objects.set(obj.id, obj);
    return obj;
  }

  makeSet(items: PyObj[], frozen = false): PyObj {
    const dedup = new Map<string, PyObj>();
    for (const item of items) {
      const hk = pyHashKey(item);
      if (!dedup.has(hk)) dedup.set(hk, item);
    }
    const obj = new PyObj(this.allocId(), frozen ? 'frozenset' : 'set', Array.from(dedup.values()), !frozen);
    this.objects.set(obj.id, obj);
    return obj;
  }

  makeBytes(bytes: Uint8Array, mutable = false): PyObj {
    const obj = new PyObj(this.allocId(), mutable ? 'bytearray' : 'bytes', bytes, mutable);
    this.objects.set(obj.id, obj);
    return obj;
  }

  makeFunction(fn: PyFunctionVal): PyObj {
    const obj = new PyObj(this.allocId(), 'function', fn, false);
    this.objects.set(obj.id, obj);
    return obj;
  }

  makeBuiltin(name: string): PyObj {
    const obj = new PyObj(this.allocId(), 'function', { name }, false);
    this.objects.set(obj.id, obj);
    return obj;
  }

  makeModule(name: string, attrs: Record<string, PyObj>): PyObj {
    const obj = new PyObj(this.allocId(), 'module', { name, attrs }, false);
    this.objects.set(obj.id, obj);
    return obj;
  }

  snapshot(): Record<number, PyObjectSnapshot> {
    const snap: Record<number, PyObjectSnapshot> = {};
    for (const [id, obj] of this.objects.entries()) {
      snap[id] = {
        id,
        type: obj.type,
        repr: pyRepr(obj),
        mutable: obj.mutable,
        previewValue: pyToPreview(obj),
      };
    }
    return snap;
  }
}

export function pyHashKey(obj: PyObj): string {
  if (obj.type === 'int' || obj.type === 'float' || obj.type === 'bool') {
    const num = obj.type === 'bool' ? (obj.val ? 1 : 0) : Number(obj.val);
    return `num:${num}`;
  }
  if (obj.type === 'str') return `str:${String(obj.val)}`;
  if (obj.type === 'bytes') {
    const arr = obj.val as Uint8Array;
    return `bytes:${Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('')}`;
  }
  if (obj.type === 'NoneType') return 'none';
  if (obj.type === 'tuple') {
    const items = obj.val as PyObj[];
    return `tuple:(${items.map(pyHashKey).join(',')})`;
  }
  if (obj.type === 'frozenset') {
    const items = obj.val as PyObj[];
    return `frozenset:(${items.map(pyHashKey).sort().join(',')})`;
  }
  throw new PyError('TypeError', `unhashable type: '${obj.type}'`);
}

export function pyBool(obj: PyObj): boolean {
  switch (obj.type) {
    case 'NoneType':
      return false;
    case 'bool':
      return Boolean(obj.val);
    case 'int':
    case 'float':
      return Number(obj.val) !== 0;
    case 'complex': {
      const c = obj.val as PyComplexVal;
      return c.real !== 0 || c.imag !== 0;
    }
    case 'str':
      return (obj.val as string).length > 0;
    case 'list':
    case 'tuple':
    case 'set':
    case 'frozenset':
      return (obj.val as PyObj[]).length > 0;
    case 'dict':
      return (obj.val as Map<string, unknown>).size > 0;
    case 'range': {
      const r = obj.val as PyRangeVal;
      return rangeLength(r) > 0;
    }
    case 'bytes':
    case 'bytearray':
      return (obj.val as Uint8Array).length > 0;
    default:
      return true;
  }
}

export function rangeLength(r: PyRangeVal): number {
  if (r.step > 0) {
    if (r.start >= r.stop) return 0;
    return Math.ceil((r.stop - r.start) / r.step);
  } else {
    if (r.start <= r.stop) return 0;
    return Math.ceil((r.start - r.stop) / -r.step);
  }
}

export function rangeToArray(r: PyRangeVal): number[] {
  const len = Math.min(rangeLength(r), 5000);
  const out: number[] = [];
  for (let i = 0; i < len; i++) {
    out.push(r.start + i * r.step);
  }
  return out;
}

export function pyRepr(obj: PyObj, depth = 0): string {
  if (depth > 4) return '...';
  switch (obj.type) {
    case 'NoneType':
      return 'None';
    case 'bool':
      return obj.val ? 'True' : 'False';
    case 'int':
      return String(obj.val);
    case 'float': {
      const n = Number(obj.val);
      if (Number.isNaN(n)) return 'nan';
      if (n === Infinity) return 'inf';
      if (n === -Infinity) return '-inf';
      if (Number.isInteger(n)) return `${n}.0`;
      return String(n);
    }
    case 'complex': {
      const c = obj.val as PyComplexVal;
      if (c.real === 0) return `${c.imag}j`;
      const sign = c.imag >= 0 ? '+' : '';
      return `(${c.real}${sign}${c.imag}j)`;
    }
    case 'str': {
      const s = String(obj.val);
      if (s.includes("'") && !s.includes('"')) return `"${s}"`;
      return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    }
    case 'list':
      return `[${(obj.val as PyObj[]).map((x) => pyRepr(x, depth + 1)).join(', ')}]`;
    case 'tuple': {
      const items = obj.val as PyObj[];
      if (items.length === 1) return `(${pyRepr(items[0], depth + 1)},)`;
      return `(${items.map((x) => pyRepr(x, depth + 1)).join(', ')})`;
    }
    case 'range': {
      const r = obj.val as PyRangeVal;
      return r.step === 1 ? `range(${r.start}, ${r.stop})` : `range(${r.start}, ${r.stop}, ${r.step})`;
    }
    case 'dict': {
      const map = obj.val as Map<string, { key: PyObj; value: PyObj }>;
      const pairs: string[] = [];
      for (const { key, value } of map.values()) {
        pairs.push(`${pyRepr(key, depth + 1)}: ${pyRepr(value, depth + 1)}`);
      }
      return `{${pairs.join(', ')}}`;
    }
    case 'set': {
      const items = obj.val as PyObj[];
      if (items.length === 0) return 'set()';
      return `{${items.map((x) => pyRepr(x, depth + 1)).join(', ')}}`;
    }
    case 'frozenset': {
      const items = obj.val as PyObj[];
      if (items.length === 0) return 'frozenset()';
      return `frozenset({${items.map((x) => pyRepr(x, depth + 1)).join(', ')}})`;
    }
    case 'bytes': {
      const arr = obj.val as Uint8Array;
      const chars = Array.from(arr).map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : `\\x${b.toString(16).padStart(2, '0')}`)).join('');
      return `b'${chars}'`;
    }
    case 'bytearray': {
      const arr = obj.val as Uint8Array;
      const chars = Array.from(arr).map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : `\\x${b.toString(16).padStart(2, '0')}`)).join('');
      return `bytearray(b'${chars}')`;
    }
    case 'function': {
      const fn = obj.val as PyFunctionVal | PyBuiltinVal;
      return `<function ${fn.name}>`;
    }
    default:
      return String(obj.val);
  }
}

export function pyStr(obj: PyObj): string {
  if (obj.type === 'str') return String(obj.val);
  return pyRepr(obj);
}

export function pyEquals(a: PyObj, b: PyObj): boolean {
  if (a.id === b.id) return true;
  const isNumA = a.type === 'int' || a.type === 'float' || a.type === 'bool';
  const isNumB = b.type === 'int' || b.type === 'float' || b.type === 'bool';
  if (isNumA && isNumB) {
    const na = a.type === 'bool' ? (a.val ? 1 : 0) : Number(a.val);
    const nb = b.type === 'bool' ? (b.val ? 1 : 0) : Number(b.val);
    return na === nb;
  }
  if (a.type !== b.type) return false;
  if (a.type === 'str') return a.val === b.val;
  if (a.type === 'NoneType') return true;
  if (a.type === 'complex') {
    const ca = a.val as PyComplexVal;
    const cb = b.val as PyComplexVal;
    return ca.real === cb.real && ca.imag === cb.imag;
  }
  if (a.type === 'list' || a.type === 'tuple') {
    const la = a.val as PyObj[];
    const lb = b.val as PyObj[];
    return la.length === lb.length && la.every((item, idx) => pyEquals(item, lb[idx]));
  }
  if (a.type === 'dict') {
    const da = a.val as Map<string, { key: PyObj; value: PyObj }>;
    const db = b.val as Map<string, { key: PyObj; value: PyObj }>;
    if (da.size !== db.size) return false;
    for (const [k, entry] of da.entries()) {
      const other = db.get(k);
      if (!other || !pyEquals(entry.value, other.value)) return false;
    }
    return true;
  }
  if (a.type === 'set' || a.type === 'frozenset') {
    const sa = a.val as PyObj[];
    const sb = b.val as PyObj[];
    if (sa.length !== sb.length) return false;
    return sa.every((item) => sb.some((other) => pyEquals(item, other)));
  }
  if ((a.type === 'bytes' || a.type === 'bytearray') && (b.type === 'bytes' || b.type === 'bytearray')) {
    const ba = a.val as Uint8Array;
    const bb = b.val as Uint8Array;
    if (ba.length !== bb.length) return false;
    for (let i = 0; i < ba.length; i++) {
      if (ba[i] !== bb[i]) return false;
    }
    return true;
  }
  return false;
}

export function pyToPreview(obj: PyObj): unknown {
  if (obj.type === 'int' || obj.type === 'float' || obj.type === 'bool' || obj.type === 'str' || obj.type === 'NoneType') {
    return obj.val;
  }
  return pyRepr(obj);
}

export function formatWithSpec(obj: PyObj, spec: string): string {
  if (!spec) return pyStr(obj);
  const m = spec.match(/^(.?([<>^]))?([+-])?(0)?(\d+)?(,)?(\.(\d+))?([dfs%])?$/);
  if (!m) return pyStr(obj);

  const alignChar = m[2];
  const fillChar = m[1] && m[1].length === 2 ? m[1][0] : m[4] === '0' ? '0' : ' ';
  const width = m[5] ? parseInt(m[5], 10) : 0;
  const useComma = Boolean(m[6]);
  const precision = m[8] !== undefined ? parseInt(m[8], 10) : undefined;
  const typeCode = m[9];

  let text = pyStr(obj);
  const isNumeric = obj.type === 'int' || obj.type === 'float' || obj.type === 'bool';
  const numVal = isNumeric ? (obj.type === 'bool' ? (obj.val ? 1 : 0) : Number(obj.val)) : 0;

  if (typeCode === 'f' && isNumeric) {
    const p = precision ?? 6;
    text = numVal.toFixed(p);
    if (useComma) {
      const [intPart, decPart] = text.split('.');
      text = Number(intPart).toLocaleString('en-US') + (decPart !== undefined ? `.${decPart}` : '');
    }
  } else if (typeCode === '%' && isNumeric) {
    const p = precision ?? 6;
    text = `${(numVal * 100).toFixed(p)}%`;
  } else if (typeCode === 'd' && isNumeric) {
    text = String(Math.trunc(numVal));
    if (useComma) text = Math.trunc(numVal).toLocaleString('en-US');
  } else if (useComma && isNumeric) {
    text = numVal.toLocaleString('en-US');
  }

  if (width > text.length) {
    const padLen = width - text.length;
    const effectiveAlign = alignChar || (isNumeric ? '>' : '<');
    if (effectiveAlign === '>') {
      text = fillChar.repeat(padLen) + text;
    } else if (effectiveAlign === '<') {
      text = text + fillChar.repeat(padLen);
    } else {
      const left = Math.floor(padLen / 2);
      const right = padLen - left;
      text = fillChar.repeat(left) + text + fillChar.repeat(right);
    }
  }
  return text;
}
