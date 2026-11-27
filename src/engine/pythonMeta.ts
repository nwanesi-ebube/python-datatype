import { FriendlyError } from '../types/lab';

export const PYTHON_KEYWORDS = [
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
  'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
  'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return',
  'try', 'while', 'with', 'yield',
] as const;

export const PYTHON_BUILTINS = [
  'print', 'input', 'int', 'float', 'str', 'bool', 'complex',
  'list', 'tuple', 'range', 'dict', 'set', 'frozenset', 'bytes', 'bytearray',
  'len', 'type', 'id', 'abs', 'round', 'divmod', 'pow',
  'min', 'max', 'sum', 'sorted', 'reversed', 'zip', 'enumerate', 'map', 'filter',
  'isinstance', 'repr', 'ord', 'chr', 'hex', 'bin', 'oct', 'open', 'dir', 'help',
] as const;

export interface NameCheckResult {
  name: string;
  isValid: boolean;
  rules: {
    id: string;
    label: string;
    passed: boolean;
    detail: string;
  }[];
  warnings: string[];
  styleNotes: string[];
  summary: string;
}

export function validateVariableName(rawName: string): NameCheckResult {
  const name = rawName;
  const trimmed = name.trim();
  const warnings: string[] = [];
  const styleNotes: string[] = [];

  if (name.length === 0) {
    return {
      name,
      isValid: false,
      rules: [
        { id: 'nonempty', label: 'Not empty', passed: false, detail: 'Type at least one letter or underscore.' },
      ],
      warnings: [],
      styleNotes: [],
      summary: 'Enter a variable name above to test Python’s naming rules.',
    };
  }

  const hasSpaces = /\s/.test(name);
  const startsWithDigit = /^[0-9]/.test(name);
  // Python allows letters (including Unicode letters), digits, and underscores
  const validCharsOnly = /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
  const isKeyword = (PYTHON_KEYWORDS as readonly string[]).includes(name);
  const isBuiltin = (PYTHON_BUILTINS as readonly string[]).includes(name);

  const rules = [
    {
      id: 'no-spaces',
      label: 'No spaces',
      passed: !hasSpaces,
      detail: hasSpaces
        ? 'Spaces split a name into two separate tokens in Python. Use an underscore (_) instead.'
        : 'Contains no spaces.',
    },
    {
      id: 'start-char',
      label: 'Starts with letter or _',
      passed: !startsWithDigit && /^[A-Za-z_]/.test(name),
      detail: startsWithDigit
        ? `Starts with the digit "${name[0]}". Python variable names cannot start with a number.`
        : /^[A-Za-z_]/.test(name)
        ? 'Starts cleanly with a letter or underscore.'
        : `Starts with "${name[0]}", which is not a letter or underscore.`,
    },
    {
      id: 'allowed-chars',
      label: 'Letters, digits & _ only',
      passed: validCharsOnly,
      detail: validCharsOnly
        ? 'Every character is a letter, digit, or underscore.'
        : 'Contains a symbol (like -, ₦, $, @, or punctuation) that Python treats as an operator or syntax error.',
    },
    {
      id: 'not-keyword',
      label: 'Not a Python keyword',
      passed: !isKeyword,
      detail: isKeyword
        ? `"${name}" is a reserved Python keyword with a built-in job, so you cannot use it as a variable name.`
        : 'Not on Python’s reserved keyword list.',
    },
  ];

  const isValid = rules.every((r) => r.passed);

  if (isValid) {
    if (isBuiltin) {
      warnings.push(
        `Caution: "${name}" is a built-in Python function/type. Using it as a variable overwrites the real ${name}() tool in your program!`
      );
    }
    if (name === 'l' || name === 'O' || name === 'I') {
      warnings.push(
        `Readability tip: Single letters like "${name}" look very similar to digits (1 or 0) in many fonts. Choose a descriptive name instead.`
      );
    }
    if (/^[A-Z][A-Z0-9_]*$/.test(name) && /[A-Z]/.test(name)) {
      styleNotes.push('ALL_CAPS style — Python programmers use this convention for constants (values meant never to change).');
    } else if (/^[a-z_][a-z0-9_]*$/.test(name)) {
      styleNotes.push('snake_case style — the recommended Python convention for regular variables.');
    } else if (/[A-Z]/.test(name)) {
      styleNotes.push(
        `Contains uppercase letters. Remember Python is case-sensitive: "${name}" and "${name.toLowerCase()}" are two completely different variables.`
      );
    }
    if (name.startsWith('_') && !name.startsWith('__')) {
      styleNotes.push('Leading underscore (_) signals "internal or temporary helper variable" by convention.');
    }
  }

  let summary = '';
  if (isValid) {
    summary = isBuiltin
      ? `Technically valid syntax, but avoid naming a variable "${trimmed}" because it shadows Python’s built-in ${trimmed}().`
      : `Valid Python variable name! Python will happily attach this tag to any value.`;
  } else {
    const firstFail = rules.find((r) => !r.passed);
    summary = `Not valid in Python: ${firstFail?.detail ?? 'Check the rule breakdown below.'}`;
  }

  return {
    name,
    isValid,
    rules,
    warnings,
    styleNotes,
    summary,
  };
}

export function translatePythonError(errorType: string, message: string, line: number): FriendlyError {
  switch (errorType) {
    case 'NameError': {
      const match = message.match(/name '([^']+)' is not defined/);
      const varName = match ? match[1] : 'that name';
      return {
        errorType,
        message,
        line,
        friendlyTitle: `Not quite yet — Python doesn't know "${varName}"`,
        friendlyReason: `On line ${line}, Python looked for a name tag called "${varName}", but no variable with that exact spelling has been created yet (or it was deleted with del).`,
        hint: `Check your spelling and capitalisation (age and Age are different!), or make sure "${varName} = ..." runs before you use it.`,
      };
    }
    case 'SyntaxError': {
      return {
        errorType,
        message,
        line,
        friendlyTitle: `Not quite yet — Python got confused by the wording on line ${line}`,
        friendlyReason: `Python checks grammar before running any line. ${message}`,
        hint: 'Check variable names (no spaces, no hyphens, cannot start with a digit, not a keyword), matching quotes, and brackets.',
      };
    }
    case 'IndentationError': {
      return {
        errorType,
        message,
        line,
        friendlyTitle: `Spacing check needed on line ${line}`,
        friendlyReason: `Python uses leading spaces (indentation) to group code blocks. On line ${line}, the spacing didn't line up with the lines around it.`,
        hint: 'Make sure lines at the same level start at the exact same column (usually multiples of 4 spaces).',
      };
    }
    case 'TypeError': {
      return {
        errorType,
        message,
        line,
        friendlyTitle: `Those two types don't mix like that (line ${line})`,
        friendlyReason: `${message}. Python keeps types distinct so it doesn't guess wrongly.`,
        hint: 'Check the type badges in the Memory panel, or check whether a built-in like print or list was accidentally overwritten.',
      };
    }
    case 'ValueError': {
      return {
        errorType,
        message,
        line,
        friendlyTitle: `Right type, but the value doesn't fit (line ${line})`,
        friendlyReason: `${message}. For example, unpacking requires the exact same number of variables as items (unless you use *rest).`,
        hint: 'Count the items on the right of "=" and the names on the left, or check what you passed to int()/float().',
      };
    }
    case 'ZeroDivisionError': {
      return {
        errorType,
        message,
        line,
        friendlyTitle: `Division by zero isn't possible (line ${line})`,
        friendlyReason: 'You cannot divide a number by 0 in mathematics or Python.',
        hint: 'Check that the number after / , // , or % is not zero.',
      };
    }
    case 'IndexError': {
      return {
        errorType,
        message,
        line,
        friendlyTitle: `That position is outside the sequence (line ${line})`,
        friendlyReason: `${message}. Remember Python starts counting positions from 0.`,
        hint: 'Use len() to check how many items exist before picking a position.',
      };
    }
    case 'KeyError': {
      return {
        errorType,
        message,
        line,
        friendlyTitle: `That key isn't in the dictionary (line ${line})`,
        friendlyReason: `Python looked up the key ${message} in the dictionary, but it wasn't there.`,
        hint: 'Check the key spelling or use .get(key, default) to avoid crashing when a key is missing.',
      };
    }
    case 'AttributeError': {
      return {
        errorType,
        message,
        line,
        friendlyTitle: `That type doesn't have that tool (line ${line})`,
        friendlyReason: `${message}. Different data types carry different methods and attributes.`,
        hint: 'Use the Method Explorer or check type() in the Memory panel to see which methods belong to this data type.',
      };
    }
    default:
      return {
        errorType,
        message,
        line,
        friendlyTitle: `Something paused on line ${line}`,
        friendlyReason: message,
        hint: 'Read the line carefully and inspect your variables in the Memory panel.',
      };
  }
}
