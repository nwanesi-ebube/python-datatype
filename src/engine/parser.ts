import { Token, tokenizePython } from './lexer';
import { PyError } from './pyValues';

export type TargetNode =
  | { kind: 'NameTarget'; name: string; line: number }
  | { kind: 'StarTarget'; target: TargetNode; line: number }
  | { kind: 'TupleTarget'; elements: TargetNode[]; line: number }
  | { kind: 'SubscriptTarget'; object: ExprNode; index: ExprNode; line: number }
  | { kind: 'SubscriptSliceTarget'; object: ExprNode; lower: ExprNode | null; upper: ExprNode | null; step: ExprNode | null; line: number }
  | { kind: 'AttrTarget'; object: ExprNode; attr: string; line: number };

export type StmtNode =
  | { kind: 'Assign'; targets: TargetNode[][]; value: ExprNode; line: number }
  | { kind: 'AugAssign'; target: TargetNode; op: string; value: ExprNode; line: number }
  | { kind: 'Del'; targets: TargetNode[]; line: number }
  | { kind: 'ExprStmt'; expr: ExprNode; line: number }
  | { kind: 'Pass'; line: number }
  | { kind: 'Break'; line: number }
  | { kind: 'Continue'; line: number }
  | { kind: 'Return'; value: ExprNode | null; line: number }
  | { kind: 'Import'; names: Array<{ module: string; alias?: string }>; fromModule?: string; line: number }
  | { kind: 'If'; branches: Array<{ test: ExprNode; body: StmtNode[] }>; elseBody: StmtNode[]; line: number }
  | { kind: 'While'; test: ExprNode; body: StmtNode[]; line: number }
  | { kind: 'For'; target: TargetNode; iter: ExprNode; body: StmtNode[]; line: number }
  | { kind: 'Def'; name: string; params: string[]; body: StmtNode[]; line: number }
  | { kind: 'Try'; body: StmtNode[]; handlers: Array<{ excType: string | null; alias: string | null; body: StmtNode[] }>; finallyBody: StmtNode[]; line: number }
  | { kind: 'Raise'; message: ExprNode | null; line: number };

export type ExprNode =
  | { kind: 'Literal'; pyType: 'int' | 'float' | 'complex' | 'str' | 'bool' | 'None' | 'bytes'; value: unknown; line: number }
  | { kind: 'FString'; parts: Array<{ type: 'text'; value: string } | { type: 'expr'; expr: ExprNode; spec: string }>; line: number }
  | { kind: 'Name'; name: string; line: number }
  | { kind: 'List'; elements: ExprNode[]; line: number }
  | { kind: 'ListComp'; elt: ExprNode; target: TargetNode; iter: ExprNode; cond: ExprNode | null; line: number }
  | { kind: 'Tuple'; elements: ExprNode[]; line: number }
  | { kind: 'Dict'; entries: Array<{ key: ExprNode; value: ExprNode }>; line: number }
  | { kind: 'Set'; elements: ExprNode[]; line: number }
  | { kind: 'Unary'; op: string; operand: ExprNode; line: number }
  | { kind: 'Binary'; op: string; left: ExprNode; right: ExprNode; line: number }
  | { kind: 'Compare'; left: ExprNode; ops: string[]; comparators: ExprNode[]; line: number }
  | { kind: 'BoolOp'; op: 'and' | 'or'; values: ExprNode[]; line: number }
  | { kind: 'IfExpr'; test: ExprNode; body: ExprNode; orelse: ExprNode; line: number }
  | { kind: 'Starred'; value: ExprNode; line: number }
  | { kind: 'Subscript'; object: ExprNode; slice: { isSlice: false; index: ExprNode } | { isSlice: true; lower: ExprNode | null; upper: ExprNode | null; step: ExprNode | null }; line: number }
  | { kind: 'Attribute'; object: ExprNode; attr: string; line: number }
  | { kind: 'Call'; func: ExprNode; args: ExprNode[]; kwargs: Array<{ name: string; value: ExprNode }>; line: number };

export function parsePython(source: string): StmtNode[] {
  const tokens = tokenizePython(source);
  let pos = 0;

  const peek = (offset = 0): Token => tokens[Math.min(pos + offset, tokens.length - 1)];
  const advance = (): Token => tokens[pos++];
  const match = (type: Token['type'], value?: string): boolean => {
    const t = peek();
    if (t.type !== type) return false;
    if (value !== undefined && t.value !== value) return false;
    pos++;
    return true;
  };
  const expect = (type: Token['type'], value?: string, msg?: string): Token => {
    const t = peek();
    if (t.type !== type || (value !== undefined && t.value !== value)) {
      throw new PyError('SyntaxError', msg || `unexpected '${t.value || t.type}'`, t.line);
    }
    pos++;
    return t;
  };

  function skipNewlines() {
    while (peek().type === 'NEWLINE' || (peek().type === 'OP' && peek().value === ';')) {
      pos++;
    }
  }

  function parseProgram(): StmtNode[] {
    const stmts: StmtNode[] = [];
    skipNewlines();
    while (peek().type !== 'EOF') {
      stmts.push(parseStatement());
      skipNewlines();
    }
    return stmts;
  }

  function parseBlock(): StmtNode[] {
    expect('OP', ':', "expected ':' before block");
    if (peek().type !== 'NEWLINE') {
      const single = parseSimpleStatement();
      return [single];
    }
    expect('NEWLINE');
    expect('INDENT', undefined, 'expected an indented block');
    const stmts: StmtNode[] = [];
    while (peek().type !== 'DEDENT' && peek().type !== 'EOF') {
      skipNewlines();
      if (peek().type === 'DEDENT' || peek().type === 'EOF') break;
      stmts.push(parseStatement());
      skipNewlines();
    }
    if (peek().type === 'DEDENT') pos++;
    return stmts;
  }

  function parseStatement(): StmtNode {
    const t = peek();
    if (t.type === 'KEYWORD') {
      if (t.value === 'if') return parseIf();
      if (t.value === 'while') return parseWhile();
      if (t.value === 'for') return parseFor();
      if (t.value === 'def') return parseDef();
      if (t.value === 'try') return parseTry();
    }
    const stmt = parseSimpleStatement();
    if (peek().type === 'NEWLINE' || (peek().type === 'OP' && peek().value === ';')) {
      pos++;
    }
    return stmt;
  }

  function parseSimpleStatement(): StmtNode {
    const t = peek();
    if (t.type === 'KEYWORD') {
      if (t.value === 'pass') { pos++; return { kind: 'Pass', line: t.line }; }
      if (t.value === 'break') { pos++; return { kind: 'Break', line: t.line }; }
      if (t.value === 'continue') { pos++; return { kind: 'Continue', line: t.line }; }
      if (t.value === 'return') {
        pos++;
        const hasVal = peek().type !== 'NEWLINE' && peek().type !== 'EOF' && peek().value !== ';';
        return { kind: 'Return', value: hasVal ? parseTupleOrExpr() : null, line: t.line };
      }
      if (t.value === 'del') {
        pos++;
        const first = exprToTarget(parseExpr());
        const targets: TargetNode[] = [first];
        while (match('OP', ',')) {
          if (peek().type === 'NEWLINE' || peek().type === 'EOF') break;
          targets.push(exprToTarget(parseExpr()));
        }
        return { kind: 'Del', targets, line: t.line };
      }
      if (t.value === 'import') {
        pos++;
        const names: Array<{ module: string; alias?: string }> = [];
        do {
          const mod = expect('IDENT', undefined, 'expected module name').value;
          let alias: string | undefined;
          if (match('KEYWORD', 'as')) alias = expect('IDENT').value;
          names.push({ module: mod, alias });
        } while (match('OP', ','));
        return { kind: 'Import', names, line: t.line };
      }
      if (t.value === 'from') {
        pos++;
        const fromModule = expect('IDENT', undefined, 'expected module name').value;
        expect('KEYWORD', 'import', "expected 'import'");
        const names: Array<{ module: string; alias?: string }> = [];
        do {
          const mod = expect('IDENT', undefined, 'expected imported name').value;
          let alias: string | undefined;
          if (match('KEYWORD', 'as')) alias = expect('IDENT').value;
          names.push({ module: mod, alias });
        } while (match('OP', ','));
        return { kind: 'Import', names, fromModule, line: t.line };
      }
      if (t.value === 'raise') {
        pos++;
        const hasVal = peek().type !== 'NEWLINE' && peek().type !== 'EOF' && peek().value !== ';';
        return { kind: 'Raise', message: hasVal ? parseExpr() : null, line: t.line };
      }
    }

    if (
      t.type === 'IDENT' &&
      t.value === 'print' &&
      ['STRING', 'FSTRING', 'NUMBER', 'IDENT'].includes(peek(1).type)
    ) {
      throw new PyError(
        'SyntaxError',
        "Missing parentheses in call to 'print'. Did you mean print(...)?",
        t.line
      );
    }

    const firstExpr = parseTupleOrExpr();

    // Augmented assignment
    const augOps = ['+=', '-=', '*=', '/=', '//=', '%=', '**='];
    if (peek().type === 'OP' && augOps.includes(peek().value)) {
      const opTok = advance();
      const val = parseTupleOrExpr();
      return { kind: 'AugAssign', target: exprToTarget(firstExpr), op: opTok.value, value: val, line: t.line };
    }

    // Standard or chained assignment
    if (peek().type === 'OP' && peek().value === '=') {
      const targetGroups: TargetNode[][] = [exprToTargetList(firstExpr)];
      while (match('OP', '=')) {
        const nextExpr = parseTupleOrExpr();
        if (peek().type === 'OP' && peek().value === '=') {
          targetGroups.push(exprToTargetList(nextExpr));
        } else {
          return { kind: 'Assign', targets: targetGroups, value: nextExpr, line: t.line };
        }
      }
    }

    return { kind: 'ExprStmt', expr: firstExpr, line: t.line };
  }

  function exprToTargetList(expr: ExprNode): TargetNode[] {
    if (expr.kind === 'Tuple') {
      return [exprToTarget(expr)];
    }
    return [exprToTarget(expr)];
  }

  function exprToTarget(expr: ExprNode): TargetNode {
    if (expr.kind === 'Name') return { kind: 'NameTarget', name: expr.name, line: expr.line };
    if (expr.kind === 'Starred') return { kind: 'StarTarget', target: exprToTarget(expr.value), line: expr.line };
    if (expr.kind === 'Tuple' || expr.kind === 'List') {
      return { kind: 'TupleTarget', elements: expr.elements.map(exprToTarget), line: expr.line };
    }
    if (expr.kind === 'Subscript') {
      if (!expr.slice.isSlice) {
        return { kind: 'SubscriptTarget', object: expr.object, index: expr.slice.index, line: expr.line };
      }
      return {
        kind: 'SubscriptSliceTarget',
        object: expr.object,
        lower: expr.slice.lower,
        upper: expr.slice.upper,
        step: expr.slice.step,
        line: expr.line,
      };
    }
    if (expr.kind === 'Attribute') {
      return { kind: 'AttrTarget', object: expr.object, attr: expr.attr, line: expr.line };
    }
    throw new PyError('SyntaxError', 'cannot assign to expression here', expr.line);
  }

  function parseIf(): StmtNode {
    const line = expect('KEYWORD', 'if').line;
    const branches: Array<{ test: ExprNode; body: StmtNode[] }> = [];
    const test = parseExpr();
    const body = parseBlock();
    branches.push({ test, body });
    skipNewlines();
    while (match('KEYWORD', 'elif')) {
      const elifTest = parseExpr();
      const elifBody = parseBlock();
      branches.push({ test: elifTest, body: elifBody });
      skipNewlines();
    }
    let elseBody: StmtNode[] = [];
    if (match('KEYWORD', 'else')) {
      elseBody = parseBlock();
    }
    return { kind: 'If', branches, elseBody, line };
  }

  function parseWhile(): StmtNode {
    const line = expect('KEYWORD', 'while').line;
    const test = parseExpr();
    const body = parseBlock();
    return { kind: 'While', test, body, line };
  }

  function parseFor(): StmtNode {
    const line = expect('KEYWORD', 'for').line;
    const targetExpr = parseTupleOrExpr(true);
    expect('KEYWORD', 'in', "expected 'in' in for loop");
    const iter = parseTupleOrExpr();
    const body = parseBlock();
    return { kind: 'For', target: exprToTarget(targetExpr), iter, body, line };
  }

  function parseDef(): StmtNode {
    const line = expect('KEYWORD', 'def').line;
    const name = expect('IDENT', undefined, 'expected function name').value;
    expect('OP', '(', "expected '(' after function name");
    const params: string[] = [];
    while (peek().type !== 'OP' || peek().value !== ')') {
      params.push(expect('IDENT', undefined, 'expected parameter name').value);
      if (!match('OP', ',')) break;
    }
    expect('OP', ')', "expected ')'");
    const body = parseBlock();
    return { kind: 'Def', name, params, body, line };
  }

  function parseTry(): StmtNode {
    const line = expect('KEYWORD', 'try').line;
    const body = parseBlock();
    const handlers: Array<{ excType: string | null; alias: string | null; body: StmtNode[] }> = [];
    let finallyBody: StmtNode[] = [];
    skipNewlines();
    while (match('KEYWORD', 'except')) {
      let excType: string | null = null;
      let alias: string | null = null;
      if (peek().type === 'IDENT') {
        excType = advance().value;
        if (match('KEYWORD', 'as')) {
          alias = expect('IDENT').value;
        }
      }
      const hBody = parseBlock();
      handlers.push({ excType, alias, body: hBody });
      skipNewlines();
    }
    if (match('KEYWORD', 'finally')) {
      finallyBody = parseBlock();
    }
    return { kind: 'Try', body, handlers, finallyBody, line };
  }

  function parseTupleOrExpr(stopAtIn = false): ExprNode {
    const first = parseExprOrStar(stopAtIn);
    if (peek().type === 'OP' && peek().value === ',') {
      const elements: ExprNode[] = [first];
      while (match('OP', ',')) {
        if (
          peek().type === 'NEWLINE' ||
          peek().type === 'EOF' ||
          (peek().type === 'OP' && ['=', ')', ']', '}', ':'].includes(peek().value)) ||
          (stopAtIn && peek().type === 'KEYWORD' && peek().value === 'in')
        ) {
          break;
        }
        elements.push(parseExprOrStar(stopAtIn));
      }
      return { kind: 'Tuple', elements, line: first.line };
    }
    return first;
  }

  function parseExprOrStar(stopAtIn = false): ExprNode {
    if (peek().type === 'OP' && peek().value === '*') {
      const t = advance();
      return { kind: 'Starred', value: parseExpr(stopAtIn), line: t.line };
    }
    return parseExpr(stopAtIn);
  }

  function parseExpr(stopAtIn = false): ExprNode {
    const expr = parseOr(stopAtIn);
    if (!stopAtIn && peek().type === 'KEYWORD' && peek().value === 'if') {
      advance();
      const test = parseOr();
      expect('KEYWORD', 'else', "expected 'else' in conditional expression");
      const orelse = parseExpr();
      return { kind: 'IfExpr', test, body: expr, orelse, line: expr.line };
    }
    return expr;
  }

  function parseOr(stopAtIn = false): ExprNode {
    let left = parseAnd(stopAtIn);
    if (peek().type === 'KEYWORD' && peek().value === 'or') {
      const values = [left];
      while (match('KEYWORD', 'or')) values.push(parseAnd(stopAtIn));
      return { kind: 'BoolOp', op: 'or', values, line: left.line };
    }
    return left;
  }

  function parseAnd(stopAtIn = false): ExprNode {
    let left = parseNot(stopAtIn);
    if (peek().type === 'KEYWORD' && peek().value === 'and') {
      const values = [left];
      while (match('KEYWORD', 'and')) values.push(parseNot(stopAtIn));
      return { kind: 'BoolOp', op: 'and', values, line: left.line };
    }
    return left;
  }

  function parseNot(stopAtIn = false): ExprNode {
    if (peek().type === 'KEYWORD' && peek().value === 'not') {
      const t = advance();
      return { kind: 'Unary', op: 'not', operand: parseNot(stopAtIn), line: t.line };
    }
    return parseComparison(stopAtIn);
  }

  function parseComparison(stopAtIn = false): ExprNode {
    const left = parseBitOr();
    const ops: string[] = [];
    const comparators: ExprNode[] = [];

    while (true) {
      const t = peek();
      if (t.type === 'OP' && ['==', '!=', '<', '<=', '>', '>='].includes(t.value)) {
        advance();
        ops.push(t.value);
        comparators.push(parseBitOr());
      } else if (!stopAtIn && t.type === 'KEYWORD' && t.value === 'in') {
        advance();
        ops.push('in');
        comparators.push(parseBitOr());
      } else if (!stopAtIn && t.type === 'KEYWORD' && t.value === 'not' && peek(1).type === 'KEYWORD' && peek(1).value === 'in') {
        advance(); advance();
        ops.push('not in');
        comparators.push(parseBitOr());
      } else if (t.type === 'KEYWORD' && t.value === 'is') {
        advance();
        if (match('KEYWORD', 'not')) {
          ops.push('is not');
        } else {
          ops.push('is');
        }
        comparators.push(parseBitOr());
      } else {
        break;
      }
    }

    if (ops.length === 0) return left;
    return { kind: 'Compare', left, ops, comparators, line: left.line };
  }

  function parseBitOr(): ExprNode {
    let left = parseBitXor();
    while (peek().type === 'OP' && peek().value === '|') {
      const op = advance().value;
      left = { kind: 'Binary', op, left, right: parseBitXor(), line: left.line };
    }
    return left;
  }

  function parseBitXor(): ExprNode {
    let left = parseBitAnd();
    while (peek().type === 'OP' && peek().value === '^') {
      const op = advance().value;
      left = { kind: 'Binary', op, left, right: parseBitAnd(), line: left.line };
    }
    return left;
  }

  function parseBitAnd(): ExprNode {
    let left = parseShift();
    while (peek().type === 'OP' && peek().value === '&') {
      const op = advance().value;
      left = { kind: 'Binary', op, left, right: parseShift(), line: left.line };
    }
    return left;
  }

  function parseShift(): ExprNode {
    let left = parseAddSub();
    while (peek().type === 'OP' && (peek().value === '<<' || peek().value === '>>')) {
      const op = advance().value;
      left = { kind: 'Binary', op, left, right: parseAddSub(), line: left.line };
    }
    return left;
  }

  function parseAddSub(): ExprNode {
    let left = parseMulDiv();
    while (peek().type === 'OP' && (peek().value === '+' || peek().value === '-')) {
      const op = advance().value;
      left = { kind: 'Binary', op, left, right: parseMulDiv(), line: left.line };
    }
    return left;
  }

  function parseMulDiv(): ExprNode {
    let left = parseUnary();
    while (peek().type === 'OP' && ['*', '/', '//', '%'].includes(peek().value)) {
      const op = advance().value;
      left = { kind: 'Binary', op, left, right: parseUnary(), line: left.line };
    }
    return left;
  }

  function parseUnary(): ExprNode {
    const t = peek();
    if (t.type === 'OP' && (t.value === '-' || t.value === '+' || t.value === '~')) {
      advance();
      return { kind: 'Unary', op: t.value, operand: parseUnary(), line: t.line };
    }
    return parsePower();
  }

  function parsePower(): ExprNode {
    const base = parsePostfix();
    if (peek().type === 'OP' && peek().value === '**') {
      advance();
      return { kind: 'Binary', op: '**', left: base, right: parseUnary(), line: base.line };
    }
    return base;
  }

  function parsePostfix(): ExprNode {
    let node = parseAtom();
    while (true) {
      if (match('OP', '.')) {
        const attr = expect('IDENT', undefined, 'expected attribute or method name').value;
        node = { kind: 'Attribute', object: node, attr, line: node.line };
      } else if (match('OP', '(')) {
        const args: ExprNode[] = [];
        const kwargs: Array<{ name: string; value: ExprNode }> = [];
        while (!(peek().type === 'OP' && peek().value === ')')) {
          if (peek().type === 'IDENT' && peek(1).type === 'OP' && peek(1).value === '=') {
            const kwName = advance().value;
            advance();
            kwargs.push({ name: kwName, value: parseExpr() });
          } else {
            args.push(parseExprOrStar());
          }
          if (!match('OP', ',')) break;
        }
        expect('OP', ')', "expected ')'");
        node = { kind: 'Call', func: node, args, kwargs, line: node.line };
      } else if (match('OP', '[')) {
        let lower: ExprNode | null = null;
        let upper: ExprNode | null = null;
        let step: ExprNode | null = null;
        let isSlice = false;

        if (!(peek().type === 'OP' && peek().value === ':')) {
          lower = parseExpr();
        }
        if (match('OP', ':')) {
          isSlice = true;
          if (!(peek().type === 'OP' && (peek().value === ':' || peek().value === ']'))) {
            upper = parseExpr();
          }
          if (match('OP', ':')) {
            if (!(peek().type === 'OP' && peek().value === ']')) {
              step = parseExpr();
            }
          }
        }
        expect('OP', ']', "expected ']'");
        if (isSlice) {
          node = { kind: 'Subscript', object: node, slice: { isSlice: true, lower, upper, step }, line: node.line };
        } else {
          if (!lower) throw new PyError('SyntaxError', 'expected index expression', node.line);
          node = { kind: 'Subscript', object: node, slice: { isSlice: false, index: lower }, line: node.line };
        }
      } else {
        break;
      }
    }
    return node;
  }

  function parseFStringParts(raw: string, line: number): ExprNode {
    const parts: Array<{ type: 'text'; value: string } | { type: 'expr'; expr: ExprNode; spec: string }> = [];
    let i = 0;
    let buf = '';

    while (i < raw.length) {
      if (raw[i] === '{') {
        if (raw[i + 1] === '{') {
          buf += '{';
          i += 2;
          continue;
        }
        if (buf) {
          parts.push({ type: 'text', value: buf });
          buf = '';
        }
        i++;
        let depth = 1;
        let exprSrc = '';
        while (i < raw.length && depth > 0) {
          if (raw[i] === '{') depth++;
          else if (raw[i] === '}') {
            depth--;
            if (depth === 0) break;
          }
          exprSrc += raw[i];
          i++;
        }
        if (depth !== 0) throw new PyError('SyntaxError', 'f-string: single "{" is not allowed', line);
        i++; // skip '}'

        // Split format spec at top-level ':'
        let spec = '';
        let colonIdx = -1;
        let bDepth = 0;
        let inQuote: string | null = null;
        for (let k = 0; k < exprSrc.length; k++) {
          const c = exprSrc[k];
          if (inQuote) {
            if (c === inQuote && exprSrc[k - 1] !== '\\') inQuote = null;
          } else if (c === "'" || c === '"') {
            inQuote = c;
          } else if (c === '(' || c === '[' || c === '{') {
            bDepth++;
          } else if (c === ')' || c === ']' || c === '}') {
            bDepth--;
          } else if (c === ':' && bDepth === 0) {
            colonIdx = k;
            break;
          }
        }
        if (colonIdx !== -1) {
          spec = exprSrc.slice(colonIdx + 1);
          exprSrc = exprSrc.slice(0, colonIdx);
        }
        const parsedSub = parsePython(exprSrc.trim());
        const firstSub = parsedSub[0];
        if (!firstSub || firstSub.kind !== 'ExprStmt') {
          throw new PyError('SyntaxError', 'invalid expression inside f-string', line);
        }
        parts.push({ type: 'expr', expr: firstSub.expr, spec });
      } else if (raw[i] === '}' && raw[i + 1] === '}') {
        buf += '}';
        i += 2;
      } else {
        buf += raw[i];
        i++;
      }
    }
    if (buf) parts.push({ type: 'text', value: buf });
    return { kind: 'FString', parts, line };
  }

  function parseAtom(): ExprNode {
    const t = peek();
    if (t.type === 'NUMBER') {
      advance();
      return {
        kind: 'Literal',
        pyType: t.isFloat ? 'float' : 'int',
        value: t.isFloat ? parseFloat(t.value) : parseInt(t.value, 10),
        line: t.line,
      };
    }
    if (t.type === 'COMPLEX') {
      advance();
      return { kind: 'Literal', pyType: 'complex', value: parseFloat(t.value), line: t.line };
    }
    if (t.type === 'STRING') {
      advance();
      return { kind: 'Literal', pyType: 'str', value: t.value, line: t.line };
    }
    if (t.type === 'BYTES') {
      advance();
      return { kind: 'Literal', pyType: 'bytes', value: t.value, line: t.line };
    }
    if (t.type === 'FSTRING') {
      advance();
      return parseFStringParts(t.value, t.line);
    }
    if (t.type === 'KEYWORD') {
      if (t.value === 'True') { advance(); return { kind: 'Literal', pyType: 'bool', value: true, line: t.line }; }
      if (t.value === 'False') { advance(); return { kind: 'Literal', pyType: 'bool', value: false, line: t.line }; }
      if (t.value === 'None') { advance(); return { kind: 'Literal', pyType: 'None', value: null, line: t.line }; }
    }
    if (t.type === 'IDENT') {
      advance();
      return { kind: 'Name', name: t.value, line: t.line };
    }
    if (match('OP', '(')) {
      if (match('OP', ')')) return { kind: 'Tuple', elements: [], line: t.line };
      const first = parseExprOrStar();
      if (match('OP', ',')) {
        const elements: ExprNode[] = [first];
        while (!(peek().type === 'OP' && peek().value === ')')) {
          elements.push(parseExprOrStar());
          if (!match('OP', ',')) break;
        }
        expect('OP', ')');
        return { kind: 'Tuple', elements, line: t.line };
      }
      expect('OP', ')', "expected ')'");
      return first;
    }
    if (match('OP', '[')) {
      if (match('OP', ']')) return { kind: 'List', elements: [], line: t.line };
      const first = parseExprOrStar();
      if (match('KEYWORD', 'for')) {
        const target = exprToTarget(parseTupleOrExpr(true));
        expect('KEYWORD', 'in');
        const iter = parseOr();
        let cond: ExprNode | null = null;
        if (match('KEYWORD', 'if')) cond = parseOr();
        expect('OP', ']');
        return { kind: 'ListComp', elt: first, target, iter, cond, line: t.line };
      }
      const elements: ExprNode[] = [first];
      while (match('OP', ',')) {
        if (peek().type === 'OP' && peek().value === ']') break;
        elements.push(parseExprOrStar());
      }
      expect('OP', ']', "expected ']'");
      return { kind: 'List', elements, line: t.line };
    }
    if (match('OP', '{')) {
      if (match('OP', '}')) return { kind: 'Dict', entries: [], line: t.line };
      const firstKey = parseExpr();
      if (match('OP', ':')) {
        const firstVal = parseExpr();
        const entries = [{ key: firstKey, value: firstVal }];
        while (match('OP', ',')) {
          if (peek().type === 'OP' && peek().value === '}') break;
          const k = parseExpr();
          expect('OP', ':', "expected ':' in dictionary literal");
          const v = parseExpr();
          entries.push({ key: k, value: v });
        }
        expect('OP', '}', "expected '}'");
        return { kind: 'Dict', entries, line: t.line };
      } else {
        const elements = [firstKey];
        while (match('OP', ',')) {
          if (peek().type === 'OP' && peek().value === '}') break;
          elements.push(parseExpr());
        }
        expect('OP', '}', "expected '}'");
        return { kind: 'Set', elements, line: t.line };
      }
    }

    throw new PyError('SyntaxError', `unexpected '${t.value || t.type}'`, t.line);
  }

  return parseProgram();
}
