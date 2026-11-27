import { PyTypeName, UserProgress } from '../types/lab';

export interface TypeSorterCard {
  id: string;
  expr: string;
  correctType: PyTypeName;
  options: PyTypeName[];
  reason: string;
}

export const TYPE_SORTER_CARDS: TypeSorterCard[] = [
  { id: 'ts-1', expr: '42', correctType: 'int', options: ['int', 'float', 'str', 'bool'], reason: 'Whole number with no decimal point.' },
  { id: 'ts-2', expr: '4.0', correctType: 'float', options: ['int', 'float', 'complex', 'str'], reason: 'Even ".0" makes it a floating-point number (float).' },
  { id: 'ts-3', expr: '"2500"', correctType: 'str', options: ['int', 'float', 'str', 'bytes'], reason: 'Quotes wrap characters into a string (str).' },
  { id: 'ts-4', expr: 'True', correctType: 'bool', options: ['bool', 'int', 'str', 'NoneType'], reason: 'Capitalised True and False are Boolean values (bool).' },
  { id: 'ts-5', expr: 'None', correctType: 'NoneType', options: ['NoneType', 'bool', 'str', 'set'], reason: 'None is the sole value of NoneType, representing "nothing here yet".' },
  { id: 'ts-6', expr: '3 + 4j', correctType: 'complex', options: ['complex', 'float', 'int', 'tuple'], reason: 'j marks the imaginary part of a complex number.' },
  { id: 'ts-7', expr: '["Rice", "Beans"]', correctType: 'list', options: ['list', 'tuple', 'set', 'dict'], reason: 'Square brackets [] create a mutable, ordered list.' },
  { id: 'ts-8', expr: '(9.07, 7.39)', correctType: 'tuple', options: ['tuple', 'list', 'set', 'range'], reason: 'Parentheses () with commas create an immutable tuple.' },
  { id: 'ts-9', expr: '(42,)', correctType: 'tuple', options: ['tuple', 'int', 'list', 'set'], reason: 'The trailing comma turns (42,) into a 1-item tuple rather than a plain int!' },
  { id: 'ts-10', expr: 'range(1, 10, 2)', correctType: 'range', options: ['range', 'list', 'tuple', 'set'], reason: 'range() generates arithmetic numbers lazily on demand.' },
  { id: 'ts-11', expr: '{"name": "Amaka"}', correctType: 'dict', options: ['dict', 'set', 'list', 'tuple'], reason: 'Curly braces with key: value colons create a dictionary (dict).' },
  { id: 'ts-12', expr: '{}', correctType: 'dict', options: ['dict', 'set', 'frozenset', 'NoneType'], reason: 'Empty curly braces {} ALWAYS create an empty dict — use set() for an empty set!' },
  { id: 'ts-13', expr: '{"Ada", "Bola"}', correctType: 'set', options: ['set', 'dict', 'frozenset', 'tuple'], reason: 'Curly braces with single items (no colons) create a mutable set.' },
  { id: 'ts-14', expr: 'frozenset(["A", "B"])', correctType: 'frozenset', options: ['frozenset', 'set', 'tuple', 'list'], reason: 'frozenset() builds a locked, hashable immutable set.' },
  { id: 'ts-15', expr: 'b"NG-2026"', correctType: 'bytes', options: ['bytes', 'str', 'bytearray', 'list'], reason: 'The b"..." prefix creates immutable raw byte integers (0..255).' },
  { id: 'ts-16', expr: 'bytearray(b"NG")', correctType: 'bytearray', options: ['bytearray', 'bytes', 'str', 'list'], reason: 'bytearray() builds a mutable raw byte buffer.' },
  { id: 'ts-17', expr: 'set()', correctType: 'set', options: ['set', 'dict', 'frozenset', 'list'], reason: 'Calling set() with no arguments creates an empty set.' },
  { id: 'ts-18', expr: '10 / 2', correctType: 'float', options: ['float', 'int', 'complex', 'bool'], reason: 'True division (/) in Python 3 always returns a float (5.0).' },
];

export interface MethodMatchQuestion {
  id: string;
  task: string;
  sampleVar: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const METHOD_MATCH_QUESTIONS: MethodMatchQuestion[] = [
  {
    id: 'mm-1',
    task: 'Remove extra spaces at the start and end of user input without changing the middle',
    sampleVar: 'name = "  Amaka Okafor  "',
    options: ['name.strip()', 'name.replace(" ", "")', 'name.split()', 'name.lower()'],
    correctIndex: 0,
    explanation: '.strip() trims leading and trailing whitespace while keeping internal spaces intact.',
  },
  {
    id: 'mm-2',
    task: 'Add "Zobo" to the end of a mutable list queue in place',
    sampleVar: 'drinks = ["Water", "Kunu"]',
    options: ['drinks.append("Zobo")', 'drinks.extend("Zobo")', 'drinks.add("Zobo")', 'drinks.insert(0, "Zobo")'],
    correctIndex: 0,
    explanation: '.append("Zobo") adds the string as 1 item at the end; .extend("Zobo") would add Z, o, b, o separately!',
  },
  {
    id: 'mm-3',
    task: 'Look up "phone" in a dictionary safely without crashing if the key is missing',
    sampleVar: 'student = {"name": "Chidi", "score": 88}',
    options: ['student.get("phone", "None")', 'student["phone"]', 'student.pop("phone")', 'student.items("phone")'],
    correctIndex: 0,
    explanation: '.get(key, default) returns the fallback cleanly instead of raising KeyError.',
  },
  {
    id: 'mm-4',
    task: 'Remove "Musa" from a set without crashing even if "Musa" is not inside',
    sampleVar: 'club = {"Ada", "Bola"}',
    options: ['club.discard("Musa")', 'club.remove("Musa")', 'club.pop("Musa")', 'club.delete("Musa")'],
    correctIndex: 0,
    explanation: '.discard(x) quietly ignores absent elements, whereas .remove(x) raises KeyError.',
  },
  {
    id: 'mm-5',
    task: 'Join a list of town names with " -> " between each town',
    sampleVar: 'route = ["Lagos", "Ibadan", "Abuja"]',
    options: ['" -> ".join(route)', 'route.join(" -> ")', 'route.split(" -> ")', '" -> ".append(route)'],
    correctIndex: 0,
    explanation: '.join() is a string method on the separator: separator.join(list_of_strings).',
  },
  {
    id: 'mm-6',
    task: 'Encode the string "₦500" into raw UTF-8 network bytes',
    sampleVar: 'msg = "₦500"',
    options: ['msg.encode("utf-8")', 'msg.decode("utf-8")', 'msg.hex()', 'list(msg)'],
    correctIndex: 0,
    explanation: 'str.encode("utf-8") converts characters into a bytes object (0..255).',
  },
  {
    id: 'mm-7',
    task: 'Loop cleanly over every (key, value) pair in a dictionary',
    sampleVar: 'prices = {"rice": 900, "yam": 600}',
    options: ['prices.items()', 'prices.keys()', 'prices.values()', 'prices.get()'],
    correctIndex: 0,
    explanation: '.items() yields (key, value) tuples ready for "for k, v in prices.items():".',
  },
  {
    id: 'mm-8',
    task: 'Check if a float has a fractional part equal to zero (like 12.0)',
    sampleVar: 'litres = 12.0',
    options: ['litres.is_integer()', 'litres.isdigit()', 'litres.isnumeric()', 'int(litres)'],
    correctIndex: 0,
    explanation: 'float.is_integer() returns True when a float represents a whole number.',
  },
  {
    id: 'mm-9',
    task: 'Return a NEW sorted list of scores while keeping the original list unchanged',
    sampleVar: 'scores = [72, 95, 61]',
    options: ['sorted(scores)', 'scores.sort()', 'scores.reverse()', 'scores.copy()'],
    correctIndex: 0,
    explanation: 'sorted(scores) creates a new list; scores.sort() mutates the list in place and returns None.',
  },
  {
    id: 'mm-10',
    task: 'Find students who belong to BOTH coding and robotics sets',
    sampleVar: 'coding = {"Ada", "Chidi"}; robotics = {"Chidi", "Kemi"}',
    options: ['coding.intersection(robotics)', 'coding.union(robotics)', 'coding.difference(robotics)', 'coding.isdisjoint(robotics)'],
    correctIndex: 0,
    explanation: '.intersection() (or &) keeps only elements present in both sets.',
  },
  {
    id: 'mm-11',
    task: 'Make a brand-new independent nested copy so editing inner lists does not affect the original',
    sampleVar: 'ledger = [["Ada", 88], ["Bola", 91]]',
    options: ['copy.deepcopy(ledger)', 'ledger.copy()', 'ledger[:]', 'ledger'],
    correctIndex: 0,
    explanation: 'Only copy.deepcopy() clones nested mutable objects; .copy() and [:] are shallow.',
  },
  {
    id: 'mm-12',
    task: 'Test if a phone input contains only numeric digits 0–9',
    sampleVar: 'phone = "08031234567"',
    options: ['phone.isdigit()', 'phone.isalpha()', 'phone.is_integer()', 'phone.strip()'],
    correctIndex: 0,
    explanation: 'str.isdigit() returns True when the non-empty string contains only digits.',
  },
];

export interface PredictDuelRound {
  id: string;
  title: string;
  code: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const PREDICT_DUEL_ROUNDS: PredictDuelRound[] = [
  {
    id: 'pd-1',
    title: 'True Division Type',
    code: `res = 8 / 2\nprint(res, type(res))`,
    options: [`4.0 <class 'float'>`, `4 <class 'int'>`, `4.0 <class 'int'>`, `TypeError`],
    correctIndex: 0,
    explanation: 'Single slash / always produces a float in Python 3, even when 8 divides evenly by 2.',
  },
  {
    id: 'pd-2',
    title: 'String Repetition',
    code: `print("5" * 3)`,
    options: ['555', '15', '5 5 5', 'TypeError'],
    correctIndex: 0,
    explanation: 'Multiplying a string by an integer repeats the characters without adding spaces.',
  },
  {
    id: 'pd-3',
    title: 'Truthiness Trap',
    code: `print(bool("False"))`,
    options: ['True', 'False', 'None', 'ValueError'],
    correctIndex: 0,
    explanation: 'Any non-empty string is truthy in Python, regardless of the letters inside it!',
  },
  {
    id: 'pd-4',
    title: 'List Aliasing',
    code: `a = [10, 20]\nb = a\nb.append(30)\nprint(a)`,
    options: ['[10, 20, 30]', '[10, 20]', '[30]', 'TypeError'],
    correctIndex: 0,
    explanation: 'b = a attaches a second name tag to the same list, so mutating b also updates a.',
  },
  {
    id: 'pd-5',
    title: 'Indexing Bytes',
    code: `pkt = b"ABC"\nprint(pkt[0])`,
    options: ['65', "b'A'", 'A', 'TypeError'],
    correctIndex: 0,
    explanation: 'Indexing a bytes object returns an integer (0..255). ASCII "A" is 65.',
  },
  {
    id: 'pd-6',
    title: 'Empty Braces Type',
    code: `box = {}\nprint(type(box))`,
    options: [`<class 'dict'>`, `<class 'set'>`, `<class 'tuple'>`, `<class 'NoneType'>`],
    correctIndex: 0,
    explanation: '{} always builds an empty dictionary; an empty set requires set().',
  },
  {
    id: 'pd-7',
    title: 'Slice Stop Index',
    code: `word = "LAGOS"\nprint(word[1:4])`,
    options: ['AGO', 'AGOS', 'LAG', 'GOS'],
    correctIndex: 0,
    explanation: 'Slices include start index 1 ("A") and stop BEFORE index 4 ("S"), giving "AGO".',
  },
  {
    id: 'pd-8',
    title: 'Set Intersection',
    code: `print({1, 2, 3} & {2, 3, 4})`,
    options: ['{2, 3}', '{1, 2, 3, 4}', '{1, 4}', 'TypeError'],
    correctIndex: 0,
    explanation: '& computes the set intersection — items present in both sets.',
  },
  {
    id: 'pd-9',
    title: 'Safe Dict Get',
    code: `prices = {"yam": 600}\nprint(prices.get("rice", 0))`,
    options: ['0', 'None', 'KeyError', '600'],
    correctIndex: 0,
    explanation: '.get("rice", 0) returns the fallback 0 because "rice" is not in prices.',
  },
  {
    id: 'pd-10',
    title: 'Range Negative Index',
    code: `r = range(2, 10, 2)\nprint(r[-1])`,
    options: ['8', '10', '2', 'IndexError'],
    correctIndex: 0,
    explanation: 'range(2, 10, 2) holds [2, 4, 6, 8], so the last item r[-1] is 8.',
  },
];

export interface BugHunterChallenge {
  id: string;
  title: string;
  context: string;
  goal: string;
  buggyCode: string;
  expectedOutput: string;
  hint: string;
}

export const BUG_HUNTER_CHALLENGES: BugHunterChallenge[] = [
  {
    id: 'bh-1',
    title: 'The String Price Math Bug',
    context: 'Naira Tuck Shop',
    goal: 'Print exactly: Total: 700',
    buggyCode: `price = "500"\nextra = 200\ntotal = price + extra\nprint("Total:", total)`,
    expectedOutput: 'Total: 700',
    hint: 'Convert price with int(price) before adding 200.',
  },
  {
    id: 'bh-2',
    title: 'The Empty Set Trap',
    context: 'School Clubs',
    goal: 'Create an empty set, add "Coding", and print: {\'Coding\'}',
    buggyCode: `clubs = {}\nclubs.add("Coding")\nprint(clubs)`,
    expectedOutput: "{'Coding'}",
    hint: '{} creates a dict, not a set! Change {} to set().',
  },
  {
    id: 'bh-3',
    title: 'Missing Dictionary Key Crash',
    context: 'Market Price Lookup',
    goal: 'Safely print the price of "milk" using a fallback of 0: Milk: 0',
    buggyCode: `prices = {"rice": 900, "beans": 750}\nprint("Milk:", prices["milk"])`,
    expectedOutput: 'Milk: 0',
    hint: 'Use prices.get("milk", 0) instead of prices["milk"].',
  },
  {
    id: 'bh-4',
    title: 'Accidental Aliasing Bug',
    context: 'Student Backup List',
    goal: 'Keep original unchanged [10, 20] and print: Original: [10, 20] | Copy: [10, 20, 30]',
    buggyCode: `original = [10, 20]\ncopy_list = original\ncopy_list.append(30)\nprint("Original:", original, "| Copy:", copy_list)`,
    expectedOutput: 'Original: [10, 20] | Copy: [10, 20, 30]',
    hint: 'Replace copy_list = original with copy_list = original.copy().',
  },
  {
    id: 'bh-5',
    title: 'Decimal String to Int',
    context: 'Fuel Pump Reading',
    goal: 'Convert "14.8" to an integer 14 and print: Whole litres: 14',
    buggyCode: `litres_text = "14.8"\nwhole = int(litres_text)\nprint("Whole litres:", whole)`,
    expectedOutput: 'Whole litres: 14',
    hint: 'Convert "14.8" to float() first: int(float(litres_text)).',
  },
  {
    id: 'bh-6',
    title: 'Immutable Bytes Edit',
    context: 'Network Packet',
    goal: 'Change first byte to 88 ("X") and print decoded text: X-OK',
    buggyCode: `pkt = b"A-OK"\npkt[0] = 88\nprint(pkt.decode("utf-8"))`,
    expectedOutput: 'X-OK',
    hint: 'Wrap b"A-OK" in bytearray(b"A-OK") so individual bytes are mutable.',
  },
  {
    id: 'bh-7',
    title: 'Sort Return Value Mix-up',
    context: 'Exam Leaderboard',
    goal: 'Print the sorted list without None: [55, 78, 92]',
    buggyCode: `scores = [78, 55, 92]\nranked = scores.sort()\nprint(ranked)`,
    expectedOutput: '[55, 78, 92]',
    hint: 'scores.sort() returns None! Use ranked = sorted(scores) instead.',
  },
  {
    id: 'bh-8',
    title: '1-Item Tuple Comma',
    context: 'Single Record Packing',
    goal: 'Print a 1-item tuple type: <class \'tuple\'>',
    buggyCode: `single = ("WAEC")\nprint(type(single))`,
    expectedOutput: "<class 'tuple'>",
    hint: 'Add a trailing comma inside the parentheses: ("WAEC",).',
  },
];

export interface CapstoneProject {
  id: string;
  title: string;
  subtitle: string;
  context: string;
  typesUsed: PyTypeName[];
  description: string;
  sampleInputsHint: string;
  code: string;
}

export const CAPSTONE_PROJECTS: CapstoneProject[] = [
  {
    id: 'cap-market-trader',
    title: 'Naija Market Trader',
    subtitle: 'Interactive Shop Till, Cart & Receipt Simulator',
    context: 'Mile 12 / Tuck Shop',
    typesUsed: ['dict', 'list', 'set', 'int', 'str', 'bool'],
    description:
      'Pick market items interactively using input(), track stock quantities in a dict, build a cart list, count unique categories with a set, and print a clean Naira receipt.',
    sampleInputsHint: 'Try typing: rice, then 2, then beans, then 1, then done',
    code: `# CAPSTONE 1: Naija Market Trader
prices = {"rice": 900, "beans": 750, "garri": 400, "egg": 150}
cart = []
unique_items = set()
total_naira = 0

print("=== MILE 12 SMART MARKET ===")
print("Available items:", ", ".join(prices.keys()))

while True:
    choice = input("Item to buy (or 'done'): ").strip().lower()
    if choice == "done":
        break
    if choice not in prices:
        print("Not on the stall today. Pick from:", list(prices.keys()))
        continue
    try:
        qty = int(input(f"How many bags/packs of {choice}? "))
        if qty <= 0:
            print("Quantity must be above zero.")
            continue
    except ValueError:
        print("Please enter a whole number for quantity.")
        continue

    cost = prices[choice] * qty
    cart.append((choice, qty, cost))
    unique_items.add(choice)
    total_naira += cost
    print(f"Added {qty} x {choice} = ₦{cost}")

print("\\n--- RECEIPT ---")
for name, qty, cost in cart:
    print(f"{name:8} x{qty:<2} -> ₦{cost}")
print("Unique goods:", len(unique_items), "| TOTAL: ₦" + str(total_naira))`,
  },
  {
    id: 'cap-guess-number',
    title: 'Guess the Number',
    subtitle: 'Interactive Loop, History List & ValueError Guard',
    context: 'Number Logic Challenge',
    typesUsed: ['int', 'list', 'NoneType', 'bool', 'str'],
    description:
      'Uses random.randint(), try/except ValueError validation around input(), a list of every guess made, and None to track when a guess wins.',
    sampleInputsHint: 'Try guessing numbers between 1 and 20 (e.g. 10, 15, 12...)',
    code: `# CAPSTONE 2: Guess the Number
import random

secret = random.randint(1, 20)
guesses = []
winner = None

print("I picked a secret number between 1 and 20!")
print("You have up to 5 tries. Type 'quit' to stop.")

while len(guesses) < 5:
    raw = input(f"Attempt {len(guesses) + 1}/5 - Your guess: ").strip().lower()
    if raw == "quit":
        break
    try:
        guess = int(raw)
    except ValueError:
        print("Not quite a whole number — try digits like 7 or 14.")
        continue

    guesses.append(guess)
    if guess == secret:
        winner = guess
        print(f"Spot on! You found {secret} in {len(guesses)} tries!")
        break
    elif guess < secret:
        print("Too low — try a higher number.")
    else:
        print("Too high — try a lower number.")

if winner is None:
    print(f"Nice effort! The secret number was {secret}.")
print("Your guess history:", guesses)`,
  },
  {
    id: 'cap-quiz-master',
    title: 'Quiz Master',
    subtitle: 'Multi-Type Question Bank, Score Tracker & Mastery Set',
    context: 'SS1–SS3 Python Revision',
    typesUsed: ['list', 'dict', 'tuple', 'set', 'int', 'str'],
    description:
      'Stores questions as dicts inside a list, options in immutable tuples, tracks mastered topics in a set, and prints a formatted summary report.',
    sampleInputsHint: 'Type A, B, or C for each of the 4 questions!',
    code: `# CAPSTONE 3: Python Data Types Quiz Master
questions = [
    {
        "topic": "dicts",
        "prompt": "What does {} create in Python?",
        "options": ("A) Empty dict", "B) Empty set", "C) Empty tuple"),
        "answer": "A",
    },
    {
        "topic": "division",
        "prompt": "What is the type of 10 / 2 in Python 3?",
        "options": ("A) int", "B) float", "C) str"),
        "answer": "B",
    },
    {
        "topic": "bytes",
        "prompt": "What does b'ABC'[0] return?",
        "options": ("A) b'A'", "B) 'A'", "C) 65 (int)"),
        "answer": "C",
    },
    {
        "topic": "mutability",
        "prompt": "Which type is immutable AND hashable like a set?",
        "options": ("A) list", "B) frozenset", "C) bytearray"),
        "answer": "B",
    },
]

score = 0
mastered_topics = set()

print("=== PYTHON QUIZ MASTER ===")
for idx, q in enumerate(questions, 1):
    print(f"\\nQ{idx} [{q['topic']}]: {q['prompt']}")
    for opt in q["options"]:
        print("  ", opt)
    reply = input("Your choice (A/B/C): ").strip().upper()
    if reply == q["answer"]:
        score += 1
        mastered_topics.add(q["topic"])
        print("Correct!")
    else:
        print(f"Not quite yet — the answer was {q['answer']}.")

print(f"\\nFinal Score: {score}/{len(questions)}")
print("Topics mastered:", sorted(mastered_topics))`,
  },
];

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  category: 'Curriculum' | 'Games' | 'Capstones' | 'Mastery';
  check: (p: UserProgress) => boolean;
}

export const LAB_BADGES: BadgeDefinition[] = [
  {
    id: 'badge-first-step',
    title: 'First Memory Tag',
    description: 'Complete your first interactive lesson in Scenario Theatre.',
    category: 'Curriculum',
    check: (p) => p.completedLessons.length >= 1,
  },
  {
    id: 'badge-five-lessons',
    title: 'Steady Explorer',
    description: 'Complete 5 lessons across the curriculum.',
    category: 'Curriculum',
    check: (p) => p.completedLessons.length >= 5,
  },
  {
    id: 'badge-fifteen-lessons',
    title: 'Data Types Scholar',
    description: 'Complete 15 lessons across Variables, I/O and Data Types.',
    category: 'Curriculum',
    check: (p) => p.completedLessons.length >= 15,
  },
  {
    id: 'badge-name-police',
    title: 'Syntax Gatekeeper',
    description: 'Score 50+ points in Variable Name Police.',
    category: 'Games',
    check: (p) => (p.gameHighScores['name-police'] ?? 0) >= 50,
  },
  {
    id: 'badge-type-sorter',
    title: 'Type Classifier',
    description: 'Score 60+ points in Type Sorter.',
    category: 'Games',
    check: (p) => (p.gameHighScores['type-sorter'] ?? 0) >= 60,
  },
  {
    id: 'badge-method-match',
    title: 'Toolkit Pro',
    description: 'Score 80+ points in Method Match.',
    category: 'Games',
    check: (p) => (p.gameHighScores['method-match'] ?? 0) >= 80,
  },
  {
    id: 'badge-predict-duel',
    title: 'Python Mind Reader',
    description: 'Score 70+ points in Predict Duel.',
    category: 'Games',
    check: (p) => (p.gameHighScores['predict-duel'] ?? 0) >= 70,
  },
  {
    id: 'badge-bug-hunter',
    title: 'Chief Bug Hunter',
    description: 'Fix 4+ debugging missions in Bug Hunter.',
    category: 'Games',
    check: (p) => (p.gameHighScores['bug-hunter'] ?? 0) >= 80,
  },
  {
    id: 'badge-input-detective',
    title: 'I/O Sleuth',
    description: 'Solve cases in Input Detective (60+ points).',
    category: 'Games',
    check: (p) => (p.gameHighScores['input-detective'] ?? 0) >= 60,
  },
  {
    id: 'badge-capstone-builder',
    title: 'Capstone Builder',
    description: 'Complete at least one Capstone Project.',
    category: 'Capstones',
    check: (p) =>
      p.badges.includes('badge-capstone-builder') ||
      p.completedLessons.some((id) => id.startsWith('cap-')),
  },
  {
    id: 'badge-all-capstones',
    title: 'System Architect',
    description: 'Complete all 3 Capstone Projects (Trader, Guesser, Quiz).',
    category: 'Capstones',
    check: (p) =>
      ['cap-market-trader', 'cap-guess-number', 'cap-quiz-master'].every((id) =>
        p.completedLessons.includes(id)
      ),
  },
  {
    id: 'badge-xp-300',
    title: '300 XP Trailblazer',
    description: 'Earn 300+ total XP across lessons, labs and games.',
    category: 'Mastery',
    check: (p) => p.xp >= 300,
  },
];

export const GAME_LEADERBOARD_META: Array<{ id: string; title: string; maxTypical: number }> = [
  { id: 'name-police', title: 'Variable Name Police', maxTypical: 200 },
  { id: 'print-perfect', title: 'Print Perfect', maxTypical: 100 },
  { id: 'input-detective', title: 'Input Detective', maxTypical: 120 },
  { id: 'type-sorter', title: 'Type Sorter', maxTypical: 180 },
  { id: 'method-match', title: 'Method Match', maxTypical: 180 },
  { id: 'predict-duel', title: 'Predict Duel', maxTypical: 150 },
  { id: 'bug-hunter', title: 'Bug Hunter', maxTypical: 160 },
];

export function evaluateUnlockedBadges(progress: UserProgress): string[] {
  const set = new Set(progress.badges);
  for (const badge of LAB_BADGES) {
    if (badge.check(progress)) {
      set.add(badge.id);
    }
  }
  return Array.from(set);
}
