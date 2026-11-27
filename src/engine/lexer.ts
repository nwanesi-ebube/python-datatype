import { PyError } from './pyValues';

export type TokenType =
  | 'NUMBER'
  | 'COMPLEX'
  | 'STRING'
  | 'FSTRING'
  | 'BYTES'
  | 'IDENT'
  | 'KEYWORD'
  | 'OP'
  | 'NEWLINE'
  | 'INDENT'
  | 'DEDENT'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
  isFloat?: boolean;
}

const KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
  'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
  'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return',
  'try', 'while', 'with', 'yield',
]);

const MULTI_OPS = [
  '//=', '**=', '<<=', '>>=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=',
  '//', '**', '==', '!=', '<=', '>=', '<<', '>>', '->', ':=',
];

const SINGLE_OPS = new Set([
  '+', '-', '*', '/', '%', '=', '<', '>', '(', ')', '[', ']', '{', '}',
  ',', ':', '.', '&', '|', '^', '~', ';', '@',
]);

function decodeEscape(ch: string): string {
  switch (ch) {
    case 'n': return '\n';
    case 't': return '\t';
    case 'r': return '\r';
    case '\\': return '\\';
    case "'": return "'";
    case '"': return '"';
    case '0': return '\0';
    default: return '\\' + ch;
  }
}

export function tokenizePython(source: string): Token[] {
  const lines = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const tokens: Token[] = [];
  const indentStack: number[] = [0];
  let bracketDepth = 0;

  let lineIdx = 0;
  while (lineIdx < lines.length) {
    let rawLine = lines[lineIdx];
    let lineNum = lineIdx + 1;

    // Count leading whitespace when not inside brackets
    let i = 0;
    let indent = 0;
    while (i < rawLine.length && (rawLine[i] === ' ' || rawLine[i] === '\t')) {
      indent += rawLine[i] === '\t' ? 4 : 1;
      i++;
    }

    // Blank line or pure comment line
    if (i >= rawLine.length || rawLine[i] === '#') {
      lineIdx++;
      continue;
    }

    if (bracketDepth === 0) {
      const currentIndent = indentStack[indentStack.length - 1];
      if (indent > currentIndent) {
        indentStack.push(indent);
        tokens.push({ type: 'INDENT', value: '', line: lineNum, col: 1 });
      } else if (indent < currentIndent) {
        while (indentStack.length > 1 && indentStack[indentStack.length - 1] > indent) {
          indentStack.pop();
          tokens.push({ type: 'DEDENT', value: '', line: lineNum, col: 1 });
        }
        if (indentStack[indentStack.length - 1] !== indent) {
          throw new PyError('IndentationError', 'unindent does not match any outer indentation level', lineNum);
        }
      }
    }

    // Scan tokens on this line (triple-quoted strings can span multiple lines)
    while (i < rawLine.length) {
      const ch = rawLine[i];
      if (ch === ' ' || ch === '\t') {
        i++;
        continue;
      }
      if (ch === '#') {
        break;
      }

      const col = i + 1;

      // Check string prefixes: r, f, b, rf, fr, etc.
      let strPrefix = '';
      let look = i;
      if (
        (ch === 'r' || ch === 'R' || ch === 'f' || ch === 'F' || ch === 'b' || ch === 'B') &&
        look + 1 < rawLine.length
      ) {
        const next1 = rawLine[look + 1];
        if (next1 === '"' || next1 === "'") {
          strPrefix = ch.toLowerCase();
          look += 1;
        } else if (
          look + 2 < rawLine.length &&
          (next1 === 'r' || next1 === 'R' || next1 === 'f' || next1 === 'F' || next1 === 'b' || next1 === 'B') &&
          (rawLine[look + 2] === '"' || rawLine[look + 2] === "'")
        ) {
          strPrefix = (ch + next1).toLowerCase();
          look += 2;
        }
      }

      if (strPrefix || ch === '"' || ch === "'") {
        const quote = rawLine[look];
        const isTriple = rawLine.slice(look, look + 3) === quote.repeat(3);
        const delim = isTriple ? quote.repeat(3) : quote;
        const isRaw = strPrefix.includes('r');
        const isF = strPrefix.includes('f');
        const isB = strPrefix.includes('b');
        const startLine = lineNum;

        let pos = look + delim.length;
        let out = '';
        let closed = false;

        while (!closed) {
          const curLine = lines[lineIdx];
          while (pos < curLine.length) {
            if (curLine.slice(pos, pos + delim.length) === delim) {
              pos += delim.length;
              closed = true;
              break;
            }
            const c = curLine[pos];
            if (c === '\\' && !isRaw && pos + 1 < curLine.length) {
              const esc = curLine[pos + 1];
              if (esc === 'x' && pos + 3 < curLine.length && /^[0-9a-fA-F]{2}$/.test(curLine.slice(pos + 2, pos + 4))) {
                out += String.fromCharCode(parseInt(curLine.slice(pos + 2, pos + 4), 16));
                pos += 4;
              } else if (isF && (esc === '{' || esc === '}')) {
                out += c + esc;
                pos += 2;
              } else {
                out += decodeEscape(esc);
                pos += 2;
              }
            } else {
              out += c;
              pos++;
            }
          }
          if (!closed) {
            if (!isTriple) {
              throw new PyError('SyntaxError', 'unterminated string literal', lineIdx + 1);
            }
            out += '\n';
            lineIdx++;
            if (lineIdx >= lines.length) {
              throw new PyError('SyntaxError', 'EOF while scanning triple-quoted string literal', startLine);
            }
            rawLine = lines[lineIdx];
            lineNum = lineIdx + 1;
            pos = 0;
          }
        }

        i = pos;
        tokens.push({
          type: isF ? 'FSTRING' : isB ? 'BYTES' : 'STRING',
          value: out,
          line: startLine,
          col,
        });
        continue;
      }

      // Numbers (0x hex, 0b binary, 0o octal, decimal, float, scientific, complex)
      if (/[0-9]/.test(ch) || (ch === '.' && i + 1 < rawLine.length && /[0-9]/.test(rawLine[i + 1]))) {
        const baseMatch = rawLine.slice(i).match(/^0([xX][0-9a-fA-F_]+|[bB][01_]+|[oO][0-7_]+)/);
        if (baseMatch) {
          const rawBase = baseMatch[0];
          i += rawBase.length;
          const prefix = rawBase.slice(0, 2).toLowerCase();
          const digits = rawBase.slice(2).replace(/_/g, '');
          const radix = prefix === '0x' ? 16 : prefix === '0b' ? 2 : 8;
          tokens.push({ type: 'NUMBER', value: String(parseInt(digits, radix)), line: lineNum, col, isFloat: false });
          continue;
        }
        const numMatch = rawLine.slice(i).match(/^(?:\d[\d_]*(?:\.[\d_]*)?|\.\d[\d_]*)(?:[eE][+-]?\d[\d_]*)?[jJ]?/);
        if (!numMatch) {
          throw new PyError('SyntaxError', 'invalid decimal literal', lineNum);
        }
        const rawNum = numMatch[0];
        i += rawNum.length;
        const cleaned = rawNum.replace(/_/g, '');
        if (cleaned.endsWith('j') || cleaned.endsWith('J')) {
          tokens.push({ type: 'COMPLEX', value: cleaned.slice(0, -1), line: lineNum, col });
        } else {
          const isFloat = cleaned.includes('.') || cleaned.includes('e') || cleaned.includes('E');
          tokens.push({ type: 'NUMBER', value: cleaned, line: lineNum, col, isFloat });
        }
        continue;
      }

      // Identifiers & Keywords
      if (/[A-Za-z_]/.test(ch)) {
        const idMatch = rawLine.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
        const word = idMatch ? idMatch[0] : ch;
        i += word.length;
        tokens.push({
          type: KEYWORDS.has(word) ? 'KEYWORD' : 'IDENT',
          value: word,
          line: lineNum,
          col,
        });
        continue;
      }

      // Multi-char operators
      let matchedOp = '';
      for (const op of MULTI_OPS) {
        if (rawLine.startsWith(op, i)) {
          matchedOp = op;
          break;
        }
      }
      if (matchedOp) {
        i += matchedOp.length;
        tokens.push({ type: 'OP', value: matchedOp, line: lineNum, col });
        continue;
      }

      // Single-char operators & brackets
      if (SINGLE_OPS.has(ch)) {
        if (ch === '(' || ch === '[' || ch === '{') bracketDepth++;
        if (ch === ')' || ch === ']' || ch === '}') bracketDepth = Math.max(0, bracketDepth - 1);
        i++;
        tokens.push({ type: 'OP', value: ch, line: lineNum, col });
        continue;
      }

      // Invalid character (e.g., ₦, $, ?, etc. outside strings)
      throw new PyError('SyntaxError', `invalid character '${ch}' in code`, lineNum);
    }

    if (bracketDepth === 0) {
      tokens.push({ type: 'NEWLINE', value: '\n', line: lineNum, col: rawLine.length + 1 });
    }
    lineIdx++;
  }

  if (bracketDepth > 0) {
    throw new PyError('SyntaxError', 'unclosed bracket "(", "[", or "{"', lines.length);
  }

  while (indentStack.length > 1) {
    indentStack.pop();
    tokens.push({ type: 'DEDENT', value: '', line: lines.length, col: 1 });
  }
  tokens.push({ type: 'EOF', value: '', line: lines.length, col: 1 });
  return tokens;
}
