import { DoDontItem, LessonDefinition, NamePoliceCard } from '../types/lab';

export const MODULE_A_LESSONS: LessonDefinition[] = [
  {
    id: 'a1-what-is-a-variable',
    moduleId: 'module-a',
    number: 'A1',
    title: 'What is a Variable?',
    subtitle: 'Name tags pointing to objects in memory',
    scenarioTitle: "Chinedu's School Tuck Shop Till",
    sceneType: 'tuck-shop',
    starterCode: `# Welcome to Chinedu's School Tuck Shop!
snack_name = "Meat Pie"
snack_price = 500
quantity = 3
total_cost = snack_price * quantity

print(snack_name, "x", quantity, "= ₦", total_cost)
print(type(snack_price), id(snack_price))`,
    predict: {
      prompt: 'Before running: what will type(snack_price) show in the console?',
      options: [
        "<class 'int'>",
        "<class 'str'>",
        "<class 'float'>",
        "500",
      ],
      correctIndex: 0,
      explanation:
        '500 has no decimal point and no quotes, so Python creates an int (whole-number) object and attaches the snack_price tag to it.',
    },
    realLifeUses: [
      {
        context: 'School Tuck Shop',
        title: 'Keeping item prices & totals',
        description: 'A till stores item_name, unit_price, and quantity so the total updates cleanly when a student buys 3 meat pies.',
      },
      {
        context: 'MTN / Airtel Data App',
        title: 'Tracking remaining megabytes',
        description: 'A variable like data_balance_mb changes as you stream lessons, without rewriting the app.',
      },
      {
        context: 'Football Match Scoreboard',
        title: 'Live goals counter',
        description: 'home_goals and away_goals hold numbers that update each time a team scores.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-a1-1',
        title: 'Using a variable before assigning it',
        badCode: `print(tuck_balance)\ntuck_balance = 2000`,
        errorLabel: 'NameError',
        explanation: 'Python reads top to bottom. On line 1, tuck_balance has not been created yet.',
        fixedCode: `tuck_balance = 2000\nprint(tuck_balance)`,
      },
      {
        id: 'm-a1-2',
        title: 'Confusing = (assign) with == (compare)',
        badCode: `500 = snack_price`,
        errorLabel: 'SyntaxError',
        explanation: 'The name tag always goes on the LEFT of =, and the value goes on the RIGHT.',
        fixedCode: `snack_price = 500`,
      },
    ],
    conceptsCounted: ['variable-creation', 'memory-tag', 'type-and-id'],
  },
  {
    id: 'a2-reassignment-dynamic-typing',
    moduleId: 'module-a',
    number: 'A2',
    title: 'Reassignment & Dynamic Typing',
    subtitle: 'Moving tags to new objects & changing types live',
    scenarioTitle: 'JSS2 Class Register Board',
    sceneType: 'class-register',
    starterCode: `# No "var" or "int" keyword needed in Python!
student = "Amina"
attendance = 18
print(student, "days:", attendance, "id:", id(attendance))

# Reassigning moves the tag to a NEW object
attendance = 19
print("Updated id:", id(attendance))

# Dynamic typing: the same tag can hold a different type!
attendance = "Excused"
print("Now:", attendance, type(attendance))`,
    predict: {
      prompt: 'After attendance = "Excused", does attendance still have the same id() as when it was 19?',
      options: [
        'No — Python points the tag to a brand-new str object with a new id()',
        'Yes — the old box is overwritten in place',
        'Error — a variable cannot change from int to str',
        'Yes — all variables keep one permanent id()',
      ],
      correctIndex: 0,
      explanation:
        'In Python, integers and strings are immutable objects. Reassigning simply moves the name tag to a different object in memory, so id() changes!',
    },
    realLifeUses: [
      {
        context: 'School Register',
        title: 'Flexible status fields',
        description: 'A pupil score might be an int (85) or a str ("Sick") when a teacher marks absence.',
      },
      {
        context: 'Delivery Tracker',
        title: 'Updating rider status',
        description: 'delivery_eta starts as None, becomes 25 (minutes), and later becomes "Arrived".',
      },
      {
        context: 'Exam Portal',
        title: 'Replacing temporary answers',
        description: 'When a student clicks a new option, selected_option moves its tag to the newest choice.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-a2-1',
        title: 'Adding JavaScript or C keywords like let or int',
        badCode: `int score = 85`,
        errorLabel: 'SyntaxError',
        explanation: 'Python declares variables automatically on first assignment — never write let, var, or int before the name.',
        fixedCode: `score = 85`,
      },
      {
        id: 'm-a2-2',
        title: 'Accidental case mismatch (age vs Age)',
        badCode: `age = 14\nprint(Age)`,
        errorLabel: 'NameError',
        explanation: 'Python is case-sensitive! age and Age are two completely separate tags.',
        fixedCode: `age = 14\nprint(age)`,
      },
    ],
    conceptsCounted: ['reassignment', 'dynamic-typing', 'case-sensitivity'],
  },
  {
    id: 'a3-naming-rules-conventions',
    moduleId: 'module-a',
    number: 'A3',
    title: 'Naming Rules & Conventions',
    subtitle: 'Valid tags, snake_case, constants & avoiding traps',
    scenarioTitle: 'School Gate Name Badge Office',
    sceneType: 'naming-lab',
    starterCode: `# Good Python names use snake_case and clear words
student_name = "Tunde"
_temp_pass = 101
score2 = 94
MAX_MARKS = 100  # UPPER_CASE signals a constant

# Case sensitivity: these are TWO distinct variables
age = 13
Age = 15
print(student_name, "is", age, "while Age =", Age)
print("Score:", score2, "out of", MAX_MARKS)`,
    predict: {
      prompt: 'What happens if you name a variable "class = 2" in Python?',
      options: [
        'SyntaxError — "class" is a reserved Python keyword',
        'It works normally and prints 2',
        'NameError — class is not defined',
        'TypeError — cannot assign int to class',
      ],
      correctIndex: 0,
      explanation:
        'Words like class, for, if, def, and True are reserved Python keywords with special jobs. Using them as variable names raises a SyntaxError.',
    },
    realLifeUses: [
      {
        context: 'Bank App',
        title: 'Clear snake_case names',
        description: 'account_balance is instantly readable by teammates, unlike confusing single letters like x or l.',
      },
      {
        context: 'WAEC Grading',
        title: 'Constants in UPPER_CASE',
        description: 'PASS_MARK = 50 and MAX_SUBJECTS = 9 tell other programmers "do not change these values".',
      },
      {
        context: 'Team Projects',
        title: 'Protecting built-ins',
        description: 'Never name a variable list or print — otherwise print("Hi") stops working in your file!',
      },
    ],
    commonMistakes: [
      {
        id: 'm-a3-1',
        title: 'Starting a variable name with a digit',
        badCode: `2name = "Bola"`,
        errorLabel: 'SyntaxError',
        explanation: 'Variable names can contain digits (like score2), but they can NEVER start with a digit.',
        fixedCode: `name2 = "Bola"`,
      },
      {
        id: 'm-a3-2',
        title: 'Overwriting built-in print() or list()',
        badCode: `print = 50\nprint("Hello")`,
        errorLabel: 'TypeError',
        explanation: 'Assigning 50 to "print" replaces Python’s print function with an integer! Calling 50("Hello") crashes.',
        fixedCode: `print_count = 50\nprint("Hello", print_count)`,
      },
    ],
    conceptsCounted: ['naming-rules', 'conventions', 'no-shadowing'],
  },
  {
    id: 'a4-multiple-unpacking-swap',
    moduleId: 'module-a',
    number: 'A4',
    title: 'Multiple Assignment, Unpacking & Swapping',
    subtitle: 'Shared tags, star unpacking & instant swaps',
    scenarioTitle: 'Relay Baton & Cup Swap Table',
    sceneType: 'unpacking-cups',
    starterCode: `# 1. Multiple values in one line
a, b, c = 10, 20, 30

# 2. Chained assignment: THREE tags, ONE shared object!
x = y = z = 0
print("Shared ids:", id(x) == id(y) == id(z))

# 3. Star unpacking from a list
first, *rest = ["Ada", "Bola", "Chidi", "Dami"]
print("Leader:", first, "| Team:", rest)

# 4. Python's one-line swap!
left_cup, right_cup = "Zobo", "Kunu"
left_cup, right_cup = right_cup, left_cup
print("After swap -> left:", left_cup, "right:", right_cup)`,
    predict: {
      prompt: 'After first, *rest = ["Ada", "Bola", "Chidi", "Dami"], what is stored in rest?',
      options: [
        "['Bola', 'Chidi', 'Dami']",
        "'Bola'",
        "('Bola', 'Chidi', 'Dami')",
        'ValueError: too many values to unpack',
      ],
      correctIndex: 0,
      explanation:
        'The * before rest tells Python: "collect all leftover items into a list". So first gets "Ada" and rest gets ["Bola", "Chidi", "Dami"].',
    },
    realLifeUses: [
      {
        context: 'Leaderboard',
        title: 'Top winner & runners-up',
        description: 'winner, *runners_up = ranking_list separates 1st place from everyone else in one readable line.',
      },
      {
        context: 'Seat Swapping',
        title: 'Swapping two items cleanly',
        description: 'seat_a, seat_b = seat_b, seat_a swaps values without needing a spare temporary variable.',
      },
      {
        context: 'Game Start',
        title: 'Resetting counters together',
        description: 'wins = losses = draws = 0 starts all three score counters at the exact same 0.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-a4-1',
        title: 'Mismatched count while unpacking',
        badCode: `x, y = 10, 20, 30`,
        errorLabel: 'ValueError',
        explanation: 'There are 2 names on the left but 3 numbers on the right. Add a 3rd variable or use *rest.',
        fixedCode: `x, *y = 10, 20, 30\nprint(x, y)`,
      },
      {
        id: 'm-a4-2',
        title: 'Expecting a, b = b, a to overwrite sequentially',
        badCode: `a = 1\nb = 2\na = b\nb = a\nprint(a, b)`,
        errorLabel: 'Logic Bug',
        explanation: 'Doing a = b then b = a loses the original value of a (both become 2)! Always use a, b = b, a.',
        fixedCode: `a = 1\nb = 2\na, b = b, a\nprint(a, b)`,
      },
    ],
    conceptsCounted: ['chained-assignment', 'unpacking', 'python-swap'],
  },
  {
    id: 'a5-augmented-del-constants',
    moduleId: 'module-a',
    number: 'A5',
    title: 'Augmented Assignment, del & Constants',
    subtitle: 'Shortcuts (+=, -=, *=, /=) and removing tags',
    scenarioTitle: 'Student Savings Box & Ticket Desk',
    sceneType: 'savings-ledger',
    starterCode: `SCHOOL_NAME = "Unity Secondary"
savings = 1000
savings += 500    # add pocket money
savings -= 200    # buy textbook
savings *= 2      # holiday bonus doubles it
savings /= 4      # split across 4 weeks
print(SCHOOL_NAME, "weekly budget: ₦", savings)

temp_ticket = "VIP-09"
del temp_ticket
print("Ticket deleted safely!")`,
    predict: {
      prompt: 'After savings = 1000; savings += 500; savings -= 200; savings *= 2; savings /= 4, what type is savings?',
      options: [
        'float (650.0) — because /= always produces a float',
        'int (650)',
        'str ("650")',
        'NoneType',
      ],
      correctIndex: 0,
      explanation:
        'Single slash division (/ and /=) always produces a float in Python 3, even when the division comes out evenly!',
    },
    realLifeUses: [
      {
        context: 'Mobile Wallet',
        title: 'Adding & spending with += and -=',
        description: 'wallet_ngn -= airtime_cost updates your balance cleanly in a single readable step.',
      },
      {
        context: 'Exam Cleanup',
        title: 'Removing temporary data with del',
        description: 'del draft_pin removes a sensitive temporary name tag once it is no longer needed.',
      },
      {
        context: 'School Billing',
        title: 'Constants for fixed fees',
        description: 'PTA_LEVY = 2500 uses UPPER_CASE so developers treat it as fixed across the whole school system.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-a5-1',
        title: 'Accessing a variable after del',
        badCode: `ticket = "A12"\ndel ticket\nprint(ticket)`,
        errorLabel: 'NameError',
        explanation: 'del removes the name tag completely. Trying to print(ticket) afterwards raises NameError.',
        fixedCode: `ticket = "A12"\nprint(ticket)\ndel ticket`,
      },
      {
        id: 'm-a5-2',
        title: 'Using += on a brand-new variable',
        badCode: `points += 10`,
        errorLabel: 'NameError',
        explanation: 'points += 10 means points = points + 10, so points must already exist before you add to it.',
        fixedCode: `points = 0\npoints += 10\nprint(points)`,
      },
    ],
    conceptsCounted: ['augmented-assignment', 'del-statement', 'constants'],
  },
];

export const MODULE_A_DO_DONT: DoDontItem[] = [
  {
    id: 'do-student-name',
    kind: 'do',
    title: 'student_name = "Chidi"',
    code: `student_name = "Chidi"\nprint("Welcome,", student_name)`,
    summary: 'Uses snake_case with lowercase letters and an underscore.',
    reason: 'Clear, descriptive, and follows PEP 8 Python naming conventions.',
  },
  {
    id: 'do-underscore-temp',
    kind: 'do',
    title: '_temp = 42',
    code: `_temp = 42\nprint("Helper value:", _temp)`,
    summary: 'Starting with an underscore (_) is completely legal.',
    reason: 'Programmers often start internal or temporary variable names with _.',
  },
  {
    id: 'do-score2',
    kind: 'do',
    title: 'score2 = 88',
    code: `score2 = 88\nprint("Second test:", score2)`,
    summary: 'Digits are allowed anywhere AFTER the first character.',
    reason: 'score2 starts with a letter s, so Python accepts the 2 cleanly.',
  },
  {
    id: 'dont-2name',
    kind: 'dont',
    title: '2name = "Ada"',
    code: `2name = "Ada"\nprint(2name)`,
    summary: 'Starts with a digit (2).',
    reason: 'Python raises SyntaxError immediately whenever an identifier begins with 0–9.',
  },
  {
    id: 'dont-my-name',
    kind: 'dont',
    title: 'my name = "Bola"',
    code: `my name = "Bola"\nprint(my name)`,
    summary: 'Contains a space between words.',
    reason: 'Spaces separate Python words. Use an underscore instead: my_name.',
  },
  {
    id: 'dont-class',
    kind: 'dont',
    title: 'class = "JSS3"',
    code: `class = "JSS3"\nprint(class)`,
    summary: 'Uses a reserved Python keyword.',
    reason: '"class" is reserved for defining blueprints in Python. Use student_class or class_name instead.',
  },
  {
    id: 'dont-hyphen',
    kind: 'dont',
    title: 'total-score = 95',
    code: `total-score = 95\nprint(total-score)`,
    summary: 'Contains a hyphen (-).',
    reason: 'Python reads "-" as subtraction (total minus score), causing SyntaxError.',
  },
  {
    id: 'dont-shadow-print',
    kind: 'dont',
    title: 'print = 100  (Dangerous!)',
    code: `print = 100\nprint("Testing")`,
    summary: 'Overwrites Python’s built-in print() function!',
    reason: 'Python lets you assign to "print", which breaks every print(...) call afterwards with TypeError.',
  },
  {
    id: 'dont-shadow-list',
    kind: 'dont',
    title: 'list = [1, 2]  (Dangerous!)',
    code: `list = [1, 2]\nitems = list("abc")`,
    summary: 'Shadows Python’s built-in list() converter!',
    reason: 'Now "list" points to [1, 2] instead of the list constructor, so list("abc") crashes with TypeError.',
  },
];

export const NAME_POLICE_CARDS: NamePoliceCard[] = [
  { id: 'np-1', candidate: 'student_age', isValid: true, category: 'snake_case', reason: 'Letters and underscores only, starting with a letter.' },
  { id: 'np-2', candidate: '1st_term_fee', isValid: false, category: 'Starts with digit', reason: 'Starts with "1". Variable names cannot begin with a number.' },
  { id: 'np-3', candidate: '_backup_pin', isValid: true, category: 'Leading underscore', reason: 'Starting with _ is valid and signals a temporary or internal variable.' },
  { id: 'np-4', candidate: 'for', isValid: false, category: 'Keyword', reason: '"for" is a reserved Python keyword used for loops.' },
  { id: 'np-5', candidate: 'total-naira', isValid: false, category: 'Symbol (-)', reason: 'Hyphens mean subtraction in Python. Use total_naira instead.' },
  { id: 'np-6', candidate: 'MAX_SPEED', isValid: true, category: 'Constant style', reason: 'Valid! ALL_CAPS is the Python convention for constants.' },
  { id: 'np-7', candidate: 'class room', isValid: false, category: 'Space', reason: 'Contains a space. Replace spaces with underscores (class_room).' },
  { id: 'np-8', candidate: 'score_2026', isValid: true, category: 'Letters + digits', reason: 'Digits are allowed after the first character.' },
  { id: 'np-9', candidate: 'True', isValid: false, category: 'Keyword', reason: '"True" is a reserved boolean keyword in Python.' },
  { id: 'np-10', candidate: 'price₦', isValid: false, category: 'Currency symbol', reason: 'Currency symbols like ₦ or $ are not valid in variable names.' },
  { id: 'np-11', candidate: 'jollof_plates', isValid: true, category: 'snake_case', reason: 'Clean, descriptive snake_case variable name.' },
  { id: 'np-12', candidate: 'return', isValid: false, category: 'Keyword', reason: '"return" is a reserved Python keyword for functions.' },
  { id: 'np-13', candidate: 'bus_stop_3', isValid: true, category: 'snake_case + digit', reason: 'Valid identifier starting with a letter and using underscores.' },
  { id: 'np-14', candidate: '2026_budget', isValid: false, category: 'Starts with digit', reason: 'Cannot start with a digit (2). Try budget_2026 instead.' },
  { id: 'np-15', candidate: 'print', isValid: true, category: 'Built-in shadow!', reason: 'Syntactically valid, so Python accepts it — BUT never do this in real code or print() will break!', tip: 'Valid syntax, risky habit!' },
  { id: 'np-16', candidate: 'user@school', isValid: false, category: 'Symbol (@)', reason: '@ is a special Python operator, not allowed in variable names.' },
];
