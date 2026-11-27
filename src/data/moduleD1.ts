import { LessonDefinition, MethodExplorerEntry } from '../types/lab';

export const MODULE_D1_LESSONS: LessonDefinition[] = [
  {
    id: 'd1-integers-and-operators',
    moduleId: 'module-d1',
    number: 'D1',
    title: 'Integers (int): Whole Numbers, Bases & Division',
    subtitle: 'Underscores, / vs // vs %, divmod(), bin() & hex()',
    scenarioTitle: 'Lagos Danfo Fare & Coin Change',
    sceneType: 'int-bus-fare',
    starterCode: `# Whole numbers (int) — immutable, unlimited size!
fare = 350
paid = 1_000        # Underscores make big numbers easy to read
passengers = 2

# Division: / always gives float; // gives whole quotient; % gives remainder
exact_split = paid / fare
tickets, change = divmod(paid, fare)

print(f"Exact ratio: {exact_split:.2f} ({type(exact_split)})")
print(f"Tickets bought: {tickets} | Change: ₦{change}")
print("2**10 (power):", pow(2, 10))
print("Binary of 42:", bin(42), "| Hex:", hex(42), "| Bits:", (42).bit_length())`,
    predict: {
      prompt: 'What is the result AND type of 10 / 2 in Python 3?',
      options: [
        '5.0 (float) — "/" ALWAYS returns a float',
        '5 (int) — because 10 divides evenly by 2',
        '5.0 (int)',
        'ZeroDivisionError',
      ],
      correctIndex: 0,
      explanation:
        'Single slash (/) ALWAYS returns a float in Python 3 (even 10 / 2 is 5.0). Use double slash (//) for whole-number floor division.',
    },
    realLifeUses: [
      {
        context: 'Transport & POS Change',
        title: 'Whole quotient & remainder with divmod()',
        description: 'divmod(amount, note) calculates how many ₦500 notes fit and the leftover coins in one step.',
      },
      {
        context: 'Banking & Counters',
        title: 'Readable numbers like 1_000_000',
        description: 'Python ignores underscores inside integer literals, making large naira budgets easy to check.',
      },
      {
        context: 'Digital Electronics',
        title: 'Binary & hex with bin(), hex(), 0b, 0x',
        description: 'Computer hardware and colour codes (#FF6600) use base-2 and base-16 integers.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-d1-1',
        title: 'Assuming / gives an int when division is exact',
        badCode: `items = 8 / 2\nprint(type(items), items)`,
        errorLabel: 'Type Surprise',
        explanation: '8 / 2 produces 4.0 (a float!). Use 8 // 2 if you need an integer index for a list or range().',
        fixedCode: `items = 8 // 2\nprint(type(items), items)`,
      },
      {
        id: 'm-d1-2',
        title: 'Dividing by zero with // or %',
        badCode: `share = 500 // 0\nprint(share)`,
        errorLabel: 'ZeroDivisionError',
        explanation: 'Neither /, //, nor % allows 0 on the right-hand side.',
        fixedCode: `people = 4\nshare = 500 // people\nprint("Each gets: ₦", share)`,
      },
    ],
    conceptsCounted: ['int-type', 'floor-division-mod', 'number-bases'],
  },
  {
    id: 'd2-floats-and-precision',
    moduleId: 'module-d1',
    number: 'D2',
    title: 'Floats (float): Decimals, Rounding & Precision',
    subtitle: 'Scientific notation, 0.1 + 0.2, math.isclose() & .is_integer()',
    scenarioTitle: 'Fuel Station Digital Pump',
    sceneType: 'float-fuel-pump',
    starterCode: `import math

price_per_litre = 895.50
litres = 12.5
cost = price_per_litre * litres
print(f"Fuel cost: ₦{round(cost, 2):,.2f}")

# Classic floating-point precision surprise!
a = 0.1 + 0.2
print("0.1 + 0.2 =", repr(a))
print("Exact == 0.3?", a == 0.3)
print("math.isclose(0.1 + 0.2, 0.3)?", math.isclose(a, 0.3))

# Useful float methods
print("(4.0).is_integer():", (4.0).is_integer())
print("(0.75).as_integer_ratio():", (0.75).as_integer_ratio())`,
    predict: {
      prompt: 'Why does 0.1 + 0.2 == 0.3 evaluate to False in Python?',
      options: [
        'Computers store floats in binary (base 2), so 0.1 and 0.2 have tiny rounding tails',
        'Python cannot add decimals properly',
        '0.3 is actually a string',
        'The + operator only works on integers',
      ],
      correctIndex: 0,
      explanation:
        'Just like 1/3 repeats forever in base 10 (0.3333...), 0.1 repeats in binary! Use math.isclose(a, b) or round() instead of == for floats.',
    },
    realLifeUses: [
      {
        context: 'Fuel Pumps & Physics',
        title: 'Continuous measurements',
        description: 'Litres of fuel, rainfall in millimetres, and exam averages all rely on float.',
      },
      {
        context: 'Science & Astronomy',
        title: 'Scientific notation (3.0e8)',
        description: 'Speed of light 3e8 or tiny cell sizes 1.5e-6 are written compactly as floats.',
      },
      {
        context: 'Financial Checks',
        title: 'Safe comparison with math.isclose()',
        description: 'Avoids false alarms when comparing calculated interest or tax totals.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-d2-1',
        title: 'Using == directly on computed floats',
        badCode: `if 0.1 + 0.2 == 0.3:\n    print("Matched!")\nelse:\n    print("Missed because of binary float tail!")`,
        errorLabel: 'Precision Trap',
        explanation: 'Use math.isclose(0.1 + 0.2, 0.3) when comparing floating-point results.',
        fixedCode: `import math\nif math.isclose(0.1 + 0.2, 0.3):\n    print("Matched safely with isclose!")`,
      },
    ],
    conceptsCounted: ['float-type', 'float-precision', 'float-methods'],
  },
  {
    id: 'd3-complex-numbers',
    moduleId: 'module-d1',
    number: 'D3',
    title: 'Complex Numbers (complex): Real + Imaginary (j)',
    subtitle: 'a + bj syntax, .real, .imag, .conjugate() & abs()',
    scenarioTitle: 'Physics Lab Vector Board',
    sceneType: 'complex-vector',
    starterCode: `# Complex numbers use 'j' for the imaginary unit (engineering convention)
v1 = 3 + 4j
v2 = 1 - 2j

total = v1 + v2
print("v1:", v1, "| type:", type(v1))
print("Real part:", v1.real, "| Imaginary part:", v1.imag)
print("Conjugate of v1:", v1.conjugate())
print("Vector magnitude abs(v1):", abs(v1))
print("Sum v1 + v2:", total)`,
    predict: {
      prompt: 'What does abs(3 + 4j) return?',
      options: [
        '5.0 — the distance √(3² + 4²) from (0, 0)',
        '7.0',
        '3 + 4j',
        'TypeError',
      ],
      correctIndex: 0,
      explanation:
        'For complex numbers, abs(z) computes the magnitude (Pythagorean hypotenuse √(real² + imag²)), so √(9 + 16) = 5.0.',
    },
    realLifeUses: [
      {
        context: 'SSS Physics & AC Power',
        title: 'Electrical impedance & alternating current',
        description: 'Engineers write voltage and resistance phase vectors directly using complex numbers.',
      },
      {
        context: '2D Waves & Audio',
        title: 'Signal processing & rotations',
        description: 'Multiplying complex numbers cleanly rotates vectors in 2D space.',
      },
      {
        context: 'Mathematics',
        title: 'Solving quadratic roots (x² + 1 = 0)',
        description: 'complex(real, imag) lets Python represent roots involving √(-1) seamlessly.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-d3-1',
        title: 'Writing i instead of j for imaginary numbers',
        badCode: `z = 3 + 4i`,
        errorLabel: 'SyntaxError',
        explanation: 'Maths textbooks use i, but Python follows electrical engineering and requires j (e.g. 3 + 4j).',
        fixedCode: `z = 3 + 4j\nprint(z, z.real, z.imag)`,
      },
    ],
    conceptsCounted: ['complex-type', 'real-imag-conjugate'],
  },
  {
    id: 'd4-booleans-and-truthiness',
    moduleId: 'module-d1',
    number: 'D4',
    title: 'Booleans (bool): True, False, Logic & Truthiness',
    subtitle: 'Comparisons, and/or/not, truthy vs falsy & bool-as-int',
    scenarioTitle: 'WAEC Scholarship Logic Gate',
    sceneType: 'bool-logic-gate',
    starterCode: `# Only two values exist: True and False (capitalised!)
score = 78
attendance = 92
has_fee_clearance = True

passed_exam = score >= 70
good_attendance = attendance >= 85
eligible = passed_exam and good_attendance and has_fee_clearance

print("Eligible for scholarship?", eligible, type(eligible))
print("isinstance(True, int):", isinstance(True, int), "| True + True =", True + True)

# Truthiness: empty or zero is False; non-empty is True!
print("bool(0):", bool(0), "| bool(''):", bool(""), "| bool('Zobo'):", bool("Zobo"))`,
    predict: {
      prompt: 'What does bool("False") return in Python?',
      options: [
        'True — because "False" is a non-empty string!',
        'False — because the word says False',
        'ValueError',
        'None',
      ],
      correctIndex: 0,
      explanation:
        'ANY non-empty string is truthy! Only an empty string "" (0 characters) is falsy.',
    },
    realLifeUses: [
      {
        context: 'School Portal',
        title: 'Scholarship & promotion rules',
        description: 'Combining test scores and attendance checks with and / or / not.',
      },
      {
        context: 'Counting Passes',
        title: 'Adding booleans (True == 1, False == 0)',
        description: 'sum([True, False, True]) counts how many conditions succeeded (2).',
      },
      {
        context: 'Form Checks',
        title: 'Quick emptiness check with if name:',
        description: 'Empty strings "", empty lists [], 0, and None are all falsy in if statements.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-d4-1',
        title: 'Writing lowercase true or false',
        badCode: `is_ready = true\nprint(is_ready)`,
        errorLabel: 'NameError',
        explanation: 'In Python, True and False MUST begin with a capital T and F.',
        fixedCode: `is_ready = True\nprint(is_ready)`,
      },
    ],
    conceptsCounted: ['bool-type', 'logical-ops', 'truthiness'],
  },
  {
    id: 'd5-none-and-identity',
    moduleId: 'module-d1',
    number: 'D5',
    title: 'NoneType (None): Missing Values & Identity',
    subtitle: 'None vs 0 vs "", functions with no return & "is None"',
    scenarioTitle: 'School Clinic Card & Locker Slot',
    sceneType: 'none-locker',
    starterCode: `# None represents "no value recorded yet"
blood_group = None
temperature = 0        # 0 is an actual measured number, NOT None!

print("Type of None:", type(None))
print("blood_group is None?", blood_group is None)
print("None == 0?", None == 0, "| None == ''?", None == "")

def log_visit(student):
    print("Checked in:", student)
    # No return statement -> returns None automatically!

result = log_visit("Chiamaka")
print("Function returned:", result, "| is None?", result is None)`,
    predict: {
      prompt: 'Is None equal to 0 or "" in Python?',
      options: [
        'No — None == 0 and None == "" are both False',
        'Yes, None == 0 is True',
        'Yes, None == "" is True',
        'Both raise TypeError',
      ],
      correctIndex: 0,
      explanation:
        'None is its own unique object meaning "missing/nothing yet". A score of 0 or an empty string "" are real values, so neither equals None.',
    },
    realLifeUses: [
      {
        context: 'Clinic & Database Forms',
        title: 'Distinguishing "Not Tested" from 0',
        description: 'A student whose score is 0 failed; a student whose score is None has not sat the exam yet.',
      },
      {
        context: 'print() & list.sort()',
        title: 'Void functions return None',
        description: 'print() displays text on screen as an action and hands back None as its return value.',
      },
      {
        context: 'Best Practice',
        title: 'Always check "is None" or "is not None"',
        description: 'Because there is only ONE None object in all of Python memory, "is None" is fast and safe.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-d5-1',
        title: 'Saving the return value of print() thinking it returns text',
        badCode: `msg = print("Hello!")\nprint("Saved:", msg)`,
        errorLabel: 'Logic Bug',
        explanation: 'print() sends text to the console and returns None! Use a string variable or f-string instead.',
        fixedCode: `msg = "Hello!"\nprint("Saved:", msg)`,
      },
    ],
    conceptsCounted: ['none-type', 'is-none', 'void-return'],
  },
];

export const STAGE3_METHODS: MethodExplorerEntry[] = [
  {
    id: 'int-bit-length',
    type: 'int',
    name: '.bit_length()',
    signature: 'n.bit_length() -> int',
    returns: 'int',
    mutatesInPlace: false,
    summary: 'Counts how many binary bits are needed to represent the integer (excluding sign and leading zeros).',
    sampleCode: (v) => `n = ${v}\nprint("Value:", n)\nprint("Binary:", bin(n))\nprint("bit_length():", n.bit_length())`,
    tip: 'Useful for knowing how many computer memory bits a number uses.',
  },
  {
    id: 'int-to-bytes',
    type: 'int',
    name: '.to_bytes()',
    signature: "n.to_bytes(length, byteorder='big') -> bytes",
    returns: 'bytes',
    mutatesInPlace: false,
    summary: 'Packs an integer into a fixed-length raw bytes object for files or network packets.',
    sampleCode: (v) => `n = ${v}\nraw = n.to_bytes(2, "big")\nprint("Packed bytes:", raw, type(raw))`,
    tip: 'Choose length big enough to hold the integer (e.g. 2 bytes holds up to 65,535).',
  },
  {
    id: 'int-divmod',
    type: 'int',
    name: 'divmod(a, b)',
    signature: 'divmod(a, b) -> (quotient, remainder)',
    returns: 'tuple',
    mutatesInPlace: false,
    summary: 'Computes both floor division (a // b) and remainder (a % b) together as a tuple.',
    sampleCode: (v) => `n = ${v}\nq, r = divmod(n, 10)\nprint(f"{n} divided by 10 -> {q} remainder {r}")`,
    tip: 'Great for converting total minutes into hours & minutes, or naira into note bundles!',
  },
  {
    id: 'int-bases',
    type: 'int',
    name: 'bin() / hex() / oct()',
    signature: 'bin(n), hex(n), oct(n) -> str',
    returns: 'str',
    mutatesInPlace: false,
    summary: 'Formats any integer into its binary (0b), hexadecimal (0x), or octal (0o) string representation.',
    sampleCode: (v) => `n = ${v}\nprint("bin:", bin(n))\nprint("hex:", hex(n))\nprint("oct:", oct(n))`,
    tip: 'Convert base strings back to int using int("1010", 2) or int("ff", 16).',
  },
  {
    id: 'float-is-integer',
    type: 'float',
    name: '.is_integer()',
    signature: 'x.is_integer() -> bool',
    returns: 'bool',
    mutatesInPlace: false,
    summary: 'Returns True if the float has nothing after the decimal point (like 4.0), False otherwise (like 4.5).',
    sampleCode: (v) => `x = ${v}\nprint("x =", x, "| is_integer():", x.is_integer())`,
    tip: 'Handy after division (/) to check if a bill divides evenly!',
  },
  {
    id: 'float-ratio',
    type: 'float',
    name: '.as_integer_ratio()',
    signature: 'x.as_integer_ratio() -> (numerator, denominator)',
    returns: 'tuple',
    mutatesInPlace: false,
    summary: 'Returns a pair of integers whose exact fraction equals this float.',
    sampleCode: (v) => `x = ${v}\nnum, den = x.as_integer_ratio()\nprint(f"{x} = {num}/{den}")`,
    tip: 'Try testing 0.1 to see the exact binary fraction Python actually stores inside memory!',
  },
  {
    id: 'float-round-isclose',
    type: 'float',
    name: 'round() & math.isclose()',
    signature: 'round(x, ndigits) / math.isclose(a, b)',
    returns: 'float',
    mutatesInPlace: false,
    summary: 'Rounds decimals neatly for display and compares floats safely without binary rounding surprises.',
    sampleCode: (v) => `import math\nx = ${v}\nprint("round(x, 2):", round(x, 2))\nprint("isclose(x, round(x, 2)):", math.isclose(x, round(x, 2), abs_tol=0.01))`,
    tip: 'Use round() for display (or :.2f in f-strings) and math.isclose() inside if conditions.',
  },
  {
    id: 'complex-parts',
    type: 'complex',
    name: '.real & .imag',
    signature: 'z.real -> float, z.imag -> float',
    returns: 'float',
    mutatesInPlace: false,
    summary: 'Reads the horizontal real component and vertical imaginary component as floats.',
    sampleCode: (v) => `z = ${v}\nprint("z =", z)\nprint("real:", z.real, "| imag:", z.imag)`,
    tip: 'Both .real and .imag always return floats, even when you typed integers like 3 + 4j.',
  },
  {
    id: 'complex-conjugate',
    type: 'complex',
    name: '.conjugate()',
    signature: 'z.conjugate() -> complex',
    returns: 'complex',
    mutatesInPlace: false,
    summary: 'Flips the sign of the imaginary part (a + bj becomes a - bj), reflecting the vector across the real axis.',
    sampleCode: (v) => `z = ${v}\nprint("Original:", z)\nprint("Conjugate:", z.conjugate())\nprint("Magnitude abs(z):", abs(z))`,
    tip: 'Multiplying a complex number by its conjugate always gives a real number equal to |z|²!',
  },
  {
    id: 'bool-isinstance',
    type: 'bool',
    name: 'bool() & isinstance(b, int)',
    signature: 'bool(x) -> bool',
    returns: 'bool',
    mutatesInPlace: false,
    summary: 'Converts any value into True (truthy) or False (falsy). Remember bool is a special subclass of int (True == 1, False == 0).',
    sampleCode: (v) => `flag = ${v}\nprint("flag:", flag, type(flag))\nprint("isinstance(flag, int):", isinstance(flag, int))\nprint("flag + 10 =", flag + 10)`,
    tip: 'Zero (0, 0.0) and empty containers ("", [], {}) are falsy; everything else is truthy.',
  },
  {
    id: 'none-identity',
    type: 'NoneType',
    name: 'x is None / x is not None',
    signature: 'x is None -> bool',
    returns: 'bool',
    mutatesInPlace: false,
    summary: 'Checks whether a variable points to Python’s single None object (no value assigned yet).',
    sampleCode: (v) => `val = ${v}\nprint("val:", val, "| type:", type(val))\nprint("val is None:", val is None)\nprint("bool(val):", bool(val))`,
    tip: 'Always prefer "is None" over "== None" — it is idiomatic and cannot be fooled by custom objects.',
  },
];
