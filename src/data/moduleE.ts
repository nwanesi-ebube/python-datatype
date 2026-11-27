import { LessonDefinition, PyTypeName } from '../types/lab';

export const MODULE_E_LESSONS: LessonDefinition[] = [
  {
    id: 'e1-conversion-matrix',
    moduleId: 'module-e',
    number: 'E1',
    title: 'Type Conversion Matrix (int, float, str, bool, list, set)',
    subtitle: 'Safe explicit casting, int(float(...)), base conversions & truthiness traps',
    scenarioTitle: 'Naira Pay-Point & Form Normaliser',
    sceneType: 'conversion-bridge',
    starterCode: `# Forms always arrive as strings (str) — convert explicitly!
raw_price = "2500"
raw_weight = "12.50"

naira = int(raw_price)
kg = float(raw_weight)
print("Total due:", naira + int(kg))

# Watch float -> int truncation vs round()
score = 9.8
print("int(9.8):", int(score), "| round(9.8):", round(score))

# Truthiness & container conversions
print("bool('False'):", bool("False"), "| bool(''):", bool(""))
letters = list("WAEC")
unique_letters = set(letters)
print("list:", letters, "| set:", unique_letters)
print("Hex 'ff' -> int:", int("ff", 16), "| Back to str:", str(naira))`,
    predict: {
      prompt: 'What happens if you run int("4.5") directly in Python?',
      options: [
        'ValueError — int() cannot parse a decimal string directly; use int(float("4.5"))',
        'Returns 4',
        'Returns 5',
        'Returns 4.5',
      ],
      correctIndex: 0,
      explanation:
        'int() expects whole-number digits (or an optional base) when given a string. Convert "4.5" to float("4.5") first, then wrap with int() if you want truncation.',
    },
    realLifeUses: [
      {
        context: 'School Portals & Forms',
        title: 'Turning text inputs into numbers',
        description: 'Every web form or input() box starts as str, so apps convert age with int() and fees with float().',
      },
      {
        context: 'Data Cleaning',
        title: 'Deduplicating with list(set(items))',
        description: 'Converting a list to a set strips duplicates immediately before converting back.',
      },
      {
        context: 'Networking & Hex Codes',
        title: 'Parsing base-16 and base-2 strings',
        description: 'Calling int("ff", 16) or int("1010", 2) translates hardware or colour codes cleanly.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-e1-1',
        title: 'Passing a decimal string straight into int()',
        badCode: `weight = "4.5"\nwhole = int(weight)`,
        errorLabel: 'ValueError',
        explanation: 'int("4.5") raises ValueError because "." is not a whole-number digit. Convert via float() first!',
        fixedCode: `weight = "4.5"\nwhole = int(float(weight))\nprint("Truncated kg:", whole)`,
      },
      {
        id: 'm-e1-2',
        title: 'Assuming bool("False") becomes False',
        badCode: `answer = "False"\nflag = bool(answer)\nif flag:\n    raise ValueError("Non-empty strings are always True!")`,
        errorLabel: 'ValueError',
        explanation: 'Any non-empty string — even "False" or "0" — is truthy in Python! Compare answer == "True" instead.',
        fixedCode: `answer = "False"\nflag = (answer.strip().lower() == "true")\nprint("Parsed boolean:", flag)`,
      },
    ],
    conceptsCounted: ['type-casting', 'int-float-bridge', 'truthiness'],
  },
  {
    id: 'e2-operation-lab',
    moduleId: 'module-e',
    number: 'E2',
    title: 'Operators Across Types (+, *, /, //, == vs is, in)',
    subtitle: 'How the same operator changes meaning by type, and == vs identity (is)',
    scenarioTitle: 'Fuel Station & Danfo Operator Bench',
    sceneType: 'operator-bench',
    starterCode: `# Operators adapt to the data types you feed them!
print("int + int:", 500 + 250)
print("str + str:", "NG-" + "2026")
print("list * 3:", ["A"] * 3)

# Division difference: / always gives float; // gives floor int
print("10 / 2 ->", 10 / 2, type(10 / 2))
print("10 // 3 ->", 10 // 3, "remainder:", 10 % 3)

# Value equality (==) vs Object identity (is)
bag_a = ["Rice", "Beans"]
bag_b = ["Rice", "Beans"]
bag_alias = bag_a
print("Equal values (==)?", bag_a == bag_b)
print("Same object in memory (is)?", bag_a is bag_b)
print("Alias same object (is)?", bag_a is bag_alias)`,
    predict: {
      prompt: 'What is the result and type of 8 / 2 in Python 3?',
      options: [
        '4.0 (float) — single slash / always produces a float',
        '4 (int)',
        '"4.0" (str)',
        'TypeError',
      ],
      correctIndex: 0,
      explanation:
        'In Python 3, true division (/) always returns a float (4.0) even when dividing evenly. Use // when you explicitly want floor integer division.',
    },
    realLifeUses: [
      {
        context: 'Receipts & Formatting',
        title: 'Repeating dividers with "-" * 24',
        description: 'Multiplying a str or list by an integer repeats elements cleanly without a loop.',
      },
      {
        context: 'Transport & Change',
        title: 'Using // and % to split change',
        description: 'notes = 1350 // 500 gives 2 notes, and 1350 % 500 gives ₦350 change.',
      },
      {
        context: 'Safe None Checks',
        title: 'Checking result is None instead of ==',
        description: 'Use "is" strictly for None (and checking aliasing), and "==" for comparing values.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-e2-1',
        title: 'Adding str + int without converting first',
        badCode: `fare = 350\nlabel = "Bus fare: " + fare`,
        errorLabel: 'TypeError',
        explanation: 'Python refuses to guess whether "5" + 3 means "53" or 8. Convert numbers with str(fare) or use an f-string.',
        fixedCode: `fare = 350\nlabel = "Bus fare: ₦" + str(fare)\nprint(label)`,
      },
      {
        id: 'm-e2-2',
        title: 'Subtracting two lists with - instead of sets',
        badCode: `diff = [1, 2, 3] - [2]`,
        errorLabel: 'TypeError',
        explanation: 'Lists do not support the - operator! Convert to sets ({1, 2, 3} - {2}) or use a list comprehension.',
        fixedCode: `diff = {1, 2, 3} - {2}\nprint("Set difference:", diff)`,
      },
    ],
    conceptsCounted: ['operator-overloading', 'true-vs-floor-div', 'equality-vs-identity'],
  },
  {
    id: 'e3-mutability-aliasing',
    moduleId: 'module-e',
    number: 'E3',
    title: 'Mutability, Aliasing & Shallow vs Deep Copy',
    subtitle: 'Why b = a shares memory, .copy() stops at 1 level & copy.deepcopy() clones all',
    scenarioTitle: 'Twin Shopping Carts & Class Marks Sheet',
    sceneType: 'mutability-clone',
    starterCode: `import copy

# 1. Immutable int: reassignment creates a new id()
score_a = 500
score_b = score_a
score_b = score_b + 50
print("score_a unchanged:", score_a, "| same id?", score_a is score_b)

# 2. Aliasing a mutable list: both names share ONE object!
cart_a = ["Garri", "Milk"]
cart_alias = cart_a
cart_alias.append("Sugar")
print("cart_a saw alias edit:", cart_a, "| same id?", id(cart_a) == id(cart_alias))

# 3. Nested list: Shallow copy vs Deep copy
ledger = [["Ada", 88], ["Bola", 91]]
shallow = copy.copy(ledger)
deep = copy.deepcopy(ledger)

shallow[0][1] = 99   # Inner list is STILL shared with ledger!
deep[1][1] = 100     # Deep copy is completely isolated!
print("ledger after edits:", ledger)
print("deep isolated:", deep)`,
    predict: {
      prompt: 'If a = [[1, 2], [3, 4]] and b = a.copy(), what happens after b[0].append(99)?',
      options: [
        'a[0] ALSO becomes [1, 2, 99] because .copy() is shallow',
        'Only b[0] changes; a stays [[1, 2], [3, 4]]',
        'TypeError',
        'a becomes empty',
      ],
      correctIndex: 0,
      explanation:
        'a.copy() and copy.copy(a) make a new outer list, but the inner lists inside are still shared references! Use copy.deepcopy(a) to clone nested lists independently.',
    },
    realLifeUses: [
      {
        context: 'School Gradebooks',
        title: 'Protecting original records during simulation',
        description: 'Deep-copying nested term scores lets teachers test grade curves without altering stored grades.',
      },
      {
        context: 'Function Arguments',
        title: 'Avoiding hidden side effects on callers',
        description: 'Passing a list into a function shares the object reference; copy it before mutating if the caller needs the original.',
      },
      {
        context: 'Undo / Redo History',
        title: 'Saving clean board snapshots in games',
        description: 'Grid games use copy.deepcopy(board) so undo steps don’t mutate along with future moves.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-e3-1',
        title: 'Assuming b = a makes an independent copy of a list',
        badCode: `original = [10, 20, 30]\nbackup = original\nbackup.clear()\nif len(original) == 0:\n    raise ValueError("Accidental alias wiped original!")`,
        errorLabel: 'ValueError',
        explanation: 'backup = original only adds a second name tag to the same list! Call original.copy() or list(original) instead.',
        fixedCode: `original = [10, 20, 30]\nbackup = original.copy()\nbackup.clear()\nprint("original safe:", original, "| backup:", backup)`,
      },
      {
        id: 'm-e3-2',
        title: 'Calling .copy() on an immutable tuple or str',
        badCode: `coords = (9.07, 7.39)\nother = coords.copy()`,
        errorLabel: 'AttributeError',
        explanation: 'Immutable sequences like tuple and str have no .copy() method because they can never be mutated in place!',
        fixedCode: `coords = (9.07, 7.39)\nother = coords\nprint("Safe immutable share:", coords is other)`,
      },
    ],
    conceptsCounted: ['aliasing', 'shallow-vs-deep-copy', 'mutability'],
  },
  {
    id: 'e4-choosing-right-type',
    moduleId: 'module-e',
    number: 'E4',
    title: 'Choosing the Right Python Data Type',
    subtitle: 'Matching real-world constraints (order, uniqueness, lookup, mutability) to types',
    scenarioTitle: 'Lagos School & Market System Architecture',
    sceneType: 'type-blueprint',
    starterCode: `# Every Python data type solves a specific job best:
# 1. Exact money -> int (kobo) avoids 0.1 + 0.2 float drift
balance_kobo = 250_000   # ₦2,500.00 stored cleanly as integer kobo

# 2. Fixed GPS pin -> tuple (immutable, signals fixed pair)
abuja_gps = (9.0765, 7.3986)

# 3. Ordered tuck-shop queue -> list (allows duplicates & edits)
queue = ["Chidi", "Amaka", "Chidi"]

# 4. Unique WAEC candidate IDs -> set (no duplicates, fast 'in')
verified_ids = {"WAEC-101", "WAEC-102"}

# 5. Student record by ID -> dict (instant key -> value lookup)
register = {"WAEC-101": {"name": "Amaka", "score": 92}}

print("Balance ₦:", balance_kobo / 100, "| GPS:", abuja_gps)
print("Queue len:", len(queue), "| Lookup:", register["WAEC-101"]["name"])`,
    predict: {
      prompt: 'Which type is BEST for storing thousands of registered exam numbers to reject duplicates quickly?',
      options: [
        'set — automatically prevents duplicates and checks membership in O(1)',
        'list',
        'tuple',
        'str',
      ],
      correctIndex: 0,
      explanation:
        'A set keeps items unique automatically and answers "exam_id in verified_ids" near-instantly even with thousands of entries.',
    },
    realLifeUses: [
      {
        context: 'Fintech & Naira Wallets',
        title: 'Store money in kobo (int), not float',
        description: 'Nigerian payment APIs pass amounts in kobo (integers) so 0.1 + 0.2 rounding errors never lose or invent a kobo.',
      },
      {
        context: 'School Registries',
        title: 'Pair dict keys with frozen or immutable values',
        description: 'Dictionaries give instant name/score lookup by admission ID without scanning every row.',
      },
      {
        context: 'Network & Security',
        title: 'bytes for transport, frozenset for permissions',
        description: 'Use bytes on the wire and frozenset when permission groups must stay locked or act as dict keys.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-e4-1',
        title: 'Storing fixed GPS coordinates as a list and accidentally mutating them',
        badCode: `lagos = [6.5244, 3.3792]\nlagos.sort()\nif lagos[0] < 4:\n    raise ValueError("Latitude and longitude got swapped!")`,
        errorLabel: 'ValueError',
        explanation: 'Sorting a coordinate list mixes latitude and longitude! Store fixed positional pairs in an immutable tuple.',
        fixedCode: `lagos = (6.5244, 3.3792)\nlat, lng = lagos\nprint(f"Lat {lat}, Lng {lng}")`,
      },
      {
        id: 'm-e4-2',
        title: 'Checking == 0.3 on binary floating-point currency math',
        badCode: `wallet = 0.1 + 0.2\nif wallet != 0.3:\n    raise ValueError("0.1 + 0.2 is 0.30000000000000004 in float!")`,
        errorLabel: 'ValueError',
        explanation: 'Binary floats cannot represent 0.1 or 0.2 exactly. Store currency in kobo (integers) or compare with round()/math.isclose().',
        fixedCode: `wallet_kobo = 10 + 20\nprint("Exact kobo:", wallet_kobo, "| Naira:", wallet_kobo / 100)`,
      },
    ],
    conceptsCounted: ['type-selection', 'kobo-precision', 'data-modelling'],
  },
];

// =========================================================================
// STAGE 7 INTERACTIVE LAB DATA: CONVERSION MATRIX, OPERATION LAB, MUTABILITY LAB, TYPE CHOOSER
// =========================================================================

export interface ConversionCellInfo {
  from: PyTypeName;
  to: PyTypeName;
  status: 'safe' | 'conditional' | 'error';
  code: string;
  rule: string;
}

export const CONVERSION_TYPES: PyTypeName[] = [
  'int',
  'float',
  'str',
  'bool',
  'list',
  'tuple',
  'set',
  'dict',
  'bytes',
];

export const CONVERSION_SOURCE_PRESETS: Record<string, { label: string; expr: string; type: PyTypeName }> = {
  int_42: { label: '42 (int)', expr: '42', type: 'int' },
  float_9_8: { label: '9.8 (float)', expr: '9.8', type: 'float' },
  str_num: { label: '"2500" (numeric str)', expr: '"2500"', type: 'str' },
  str_dec: { label: '"4.5" (decimal str)', expr: '"4.5"', type: 'str' },
  str_word: { label: '"LAGOS" (text str)', expr: '"LAGOS"', type: 'str' },
  str_false: { label: '"False" (str)', expr: '"False"', type: 'str' },
  bool_true: { label: 'True (bool)', expr: 'True', type: 'bool' },
  list_pairs: { label: '[("a", 1), ("b", 2)]', expr: '[("a", 1), ("b", 2)]', type: 'list' },
  list_nums: { label: '[10, 20, 10]', expr: '[10, 20, 10]', type: 'list' },
  tuple_coords: { label: '(9, 7) (tuple)', expr: '(9, 7)', type: 'tuple' },
  set_clubs: { label: '{"Ada", "Bola"}', expr: '{"Ada", "Bola"}', type: 'set' },
  dict_prices: { label: '{"rice": 900, "yam": 600}', expr: '{"rice": 900, "yam": 600}', type: 'dict' },
  bytes_hi: { label: 'b"NG-01" (bytes)', expr: 'b"NG-01"', type: 'bytes' },
};

export function getConversionRule(from: PyTypeName, to: PyTypeName): {
  status: 'safe' | 'conditional' | 'error';
  summary: string;
  sampleExpr: string;
} {
  if (from === to) {
    return { status: 'safe', summary: `Identity conversion (${to}(x) returns same type).`, sampleExpr: CONVERSION_SOURCE_PRESETS[`${from}_42`]?.expr ?? '' };
  }
  if (to === 'str' || to === 'bool') {
    return {
      status: 'safe',
      summary: to === 'str'
        ? `Every Python object can be converted to str() via its text representation.`
        : `Every Python object has a truth value: empty / 0 / None -> False, everything else -> True.`,
      sampleExpr: '',
    };
  }
  if (to === 'int') {
    if (from === 'float' || from === 'bool') return { status: 'safe', summary: 'Truncates float toward zero (9.8 -> 9) or maps True->1, False->0.', sampleExpr: '' };
    if (from === 'str') return { status: 'conditional', summary: 'Works only if the string holds whole digits (like "2500"). Decimal strings like "4.5" raise ValueError!', sampleExpr: '"2500"' };
    return { status: 'error', summary: `int() cannot convert a ${from} directly — TypeError!`, sampleExpr: '' };
  }
  if (to === 'float') {
    if (from === 'int' || from === 'bool') return { status: 'safe', summary: 'Adds floating-point representation (42 -> 42.0).', sampleExpr: '' };
    if (from === 'str') return { status: 'conditional', summary: 'Works for numeric strings ("2500", "4.5"), raises ValueError on text like "LAGOS".', sampleExpr: '"4.5"' };
    return { status: 'error', summary: `float() cannot convert a ${from} — TypeError!`, sampleExpr: '' };
  }
  if (to === 'list' || to === 'tuple' || to === 'set') {
    if (from === 'int' || from === 'float' || from === 'bool') {
      return { status: 'error', summary: `${from} is not iterable, so ${to}() raises TypeError.`, sampleExpr: '' };
    }
    if (from === 'dict') {
      return { status: 'safe', summary: `Iterating a dict yields its keys! Use d.items() or d.values() if you want values.`, sampleExpr: '' };
    }
    if (from === 'bytes') {
      return { status: 'safe', summary: `Iterating bytes yields 0..255 integers; use b.decode("utf-8") if you want text!`, sampleExpr: '' };
    }
    return {
      status: 'safe',
      summary: to === 'set'
        ? `Collects unique elements from ${from} (duplicates dropped, order not preserved).`
        : `Collects every element of ${from} into a ${to}.`,
      sampleExpr: '',
    };
  }
  if (to === 'dict') {
    if (from === 'list' || from === 'tuple' || from === 'set') {
      return { status: 'conditional', summary: 'Works ONLY if every item inside is a 2-element (key, value) pair!', sampleExpr: '[("a", 1), ("b", 2)]' };
    }
    return { status: 'error', summary: `dict() requires key-value pairs, not a plain ${from}.`, sampleExpr: '' };
  }
  if (to === 'bytes') {
    if (from === 'str') return { status: 'conditional', summary: 'In Python, bytes(str, "utf-8") or s.encode("utf-8") converts text to raw UTF-8 bytes.', sampleExpr: '' };
    if (from === 'int') return { status: 'conditional', summary: 'bytes(n) creates n zero-bytes (e.g. bytes(4) -> b"\\x00\\x00\\x00\\x00").', sampleExpr: '' };
    if (from === 'list' || from === 'tuple' || from === 'set') {
      return { status: 'conditional', summary: 'Works only if every integer inside is between 0 and 255.', sampleExpr: '[65, 66, 67]' };
    }
    return { status: 'error', summary: `Cannot directly convert ${from} to bytes.`, sampleExpr: '' };
  }
  return { status: 'conditional', summary: `Check conversion rules for ${from} -> ${to}.`, sampleExpr: '' };
}

export interface OperationPreset {
  id: string;
  label: string;
  leftExpr: string;
  op: string;
  rightExpr: string;
  takeaway: string;
}

export const OPERATION_PRESETS: OperationPreset[] = [
  {
    id: 'str-add',
    label: '"NG-" + "2026"',
    leftExpr: '"NG-"',
    op: '+',
    rightExpr: '"2026"',
    takeaway: 'With strings, + joins text end-to-end (concatenation).',
  },
  {
    id: 'str-int-err',
    label: '"₦" + 500 (TypeError)',
    leftExpr: '"₦"',
    op: '+',
    rightExpr: '500',
    takeaway: 'Python refuses to mix str + int silently — convert with str(500) first.',
  },
  {
    id: 'str-mul',
    label: '"WAEC! " * 3',
    leftExpr: '"WAEC! "',
    op: '*',
    rightExpr: '3',
    takeaway: 'Multiplying a string or list by an int repeats it.',
  },
  {
    id: 'div-true',
    label: '10 / 2 (float)',
    leftExpr: '10',
    op: '/',
    rightExpr: '2',
    takeaway: 'Single / always produces a float (5.0), even for exact division.',
  },
  {
    id: 'div-floor',
    label: '10 // 3 (floor int)',
    leftExpr: '10',
    op: '//',
    rightExpr: '3',
    takeaway: 'Double // performs floor division and returns an int when both inputs are ints.',
  },
  {
    id: 'list-eq-vs-is',
    label: '[1, 2] is [1, 2]',
    leftExpr: '[1, 2]',
    op: 'is',
    rightExpr: '[1, 2]',
    takeaway: 'Two separate list literals hold equal values (== is True) but sit at different memory ids (is is False).',
  },
  {
    id: 'set-union',
    label: '{"Ada", "Bola"} | {"Chidi"}',
    leftExpr: '{"Ada", "Bola"}',
    op: '|',
    rightExpr: '{"Chidi"}',
    takeaway: 'The | operator performs union on sets and dicts (Python 3.9+), or bitwise OR on integers.',
  },
  {
    id: 'dict-union',
    label: '{"a": 1} | {"b": 2}',
    leftExpr: '{"a": 1}',
    op: '|',
    rightExpr: '{"b": 2}',
    takeaway: 'Dictionary union | creates a merged copy without modifying either input.',
  },
  {
    id: 'in-dict',
    label: '"rice" in {"rice": 900}',
    leftExpr: '"rice"',
    op: 'in',
    rightExpr: '{"rice": 900}',
    takeaway: 'On a dict, "in" checks keys (not values!).',
  },
];

export interface TypeChooserScenario {
  id: string;
  title: string;
  context: string;
  clues: string[];
  correctType: PyTypeName;
  options: PyTypeName[];
  explanation: string;
  sampleCode: string;
}

export const TYPE_CHOOSER_SCENARIOS: TypeChooserScenario[] = [
  {
    id: 'tc-kobo',
    title: 'Wallet Balance in Kobo',
    context: 'Fintech App',
    clues: ['Exact arithmetic with zero rounding drift', 'Whole kobo counts (₦25.50 = 2550 kobo)'],
    correctType: 'int',
    options: ['int', 'float', 'str', 'bool'],
    explanation: 'Integer kobo avoids binary float errors like 0.1 + 0.2 = 0.30000000000000004.',
    sampleCode: `balance_kobo = 2500 + 50\nprint("Exact kobo:", balance_kobo, "| Naira:", balance_kobo / 100)`,
  },
  {
    id: 'tc-gps',
    title: 'Abuja School Fixed Coordinates',
    context: 'Maps & Location',
    clues: ['Latitude and longitude pair must keep order', 'Should never be accidentally sorted or mutated'],
    correctType: 'tuple',
    options: ['tuple', 'list', 'set', 'dict'],
    explanation: 'tuple keeps the (lat, lng) pair ordered and immutable so coordinates cannot be edited or sorted.',
    sampleCode: `abuja_gps = (9.0765, 7.3986)\nlat, lng = abuja_gps\nprint(f"Lat: {lat}, Lng: {lng}")`,
  },
  {
    id: 'tc-jamb',
    title: 'Unique JAMB Registration Numbers',
    context: 'Exam Portal',
    clues: ['No duplicates allowed', 'Need instant "reg_no in registered" checks'],
    correctType: 'set',
    options: ['set', 'list', 'tuple', 'str'],
    explanation: 'set guarantees uniqueness automatically and tests membership in near-constant O(1) time.',
    sampleCode: `registered = {"JAMB-01", "JAMB-02", "JAMB-01"}\nprint("Unique count:", len(registered), "| Found?", "JAMB-02" in registered)`,
  },
  {
    id: 'tc-register',
    title: 'Student Grades by Admission ID',
    context: 'School Database',
    clues: ['Look up a student record directly by ID key', 'Scores update over the term'],
    correctType: 'dict',
    options: ['dict', 'list', 'set', 'frozenset'],
    explanation: 'dict maps unique admission ID keys directly to mutable student data.',
    sampleCode: `scores = {"ADM-01": 88, "ADM-02": 94}\nprint("ADM-02 score:", scores.get("ADM-02", 0))`,
  },
  {
    id: 'tc-queue',
    title: 'Tuck Shop Waiting Line',
    context: 'Campus Tuck Shop',
    clues: ['Order matters (first come, first served)', 'Students join with .append() and leave with .pop(0)'],
    correctType: 'list',
    options: ['list', 'tuple', 'set', 'dict'],
    explanation: 'list is ordered and mutable, making it ideal for queues that grow and shrink.',
    sampleCode: `queue = ["Ada", "Bola"]\nqueue.append("Chidi")\nserved = queue.pop(0)\nprint("Served:", served, "| Remaining:", queue)`,
  },
  {
    id: 'tc-perms',
    title: 'Locked Exam Officer Permissions as Dict Key',
    context: 'Security & Access Control',
    clues: ['Set of role flags must stay locked', 'Must be hashable to serve as a dictionary key'],
    correctType: 'frozenset',
    options: ['frozenset', 'set', 'list', 'bytearray'],
    explanation: 'frozenset behaves like a set for intersections/subsets while being immutable and hashable.',
    sampleCode: `teacher_role = frozenset(["read", "grade"])\nlabels = {teacher_role: "Subject Teacher"}\nprint(labels[teacher_role])`,
  },
  {
    id: 'tc-sms',
    title: 'UTF-8 SMS Network Packet',
    context: 'Telecom / APIs',
    clues: ['Raw 0–255 bytes ready for transmission', 'Supports .decode("utf-8") and .hex()'],
    correctType: 'bytes',
    options: ['bytes', 'str', 'list', 'int'],
    explanation: 'bytes stores immutable 8-bit values (0..255) produced by text.encode("utf-8").',
    sampleCode: `pkt = "₦500".encode("utf-8")\nprint("Hex:", pkt.hex(), "| Bytes:", len(pkt))`,
  },
  {
    id: 'tc-missing',
    title: 'Score Before Exam Is Marked',
    context: 'Report Card',
    clues: ['0 would wrongly mean the student scored zero!', 'Represents "not yet graded" explicitly'],
    correctType: 'NoneType',
    options: ['NoneType', 'int', 'bool', 'str'],
    explanation: 'None (NoneType) clearly distinguishes "absent / not yet graded" from an actual score of 0.',
    sampleCode: `math_score = None\nif math_score is None:\n    print("Result pending")`,
  },
];
