import { ModuleExerciseBank, ModuleSummarySheet } from '../types/lab';
import { EXERCISES_PART_1 } from './exercisesPart1';
import { EXERCISES_PART_2 } from './exercisesPart2';

export const MODULE_EXERCISE_BANKS: ModuleExerciseBank[] = [
  ...EXERCISES_PART_1,
  ...EXERCISES_PART_2,
];

export const MODULE_SUMMARY_SHEETS: ModuleSummarySheet[] = [
  {
    moduleId: 'module-a',
    code: 'Module A',
    title: 'Variables & Memory Tags',
    bigIdea: 'Python variables are name tags pointing to typed objects in memory — types live on objects, never on names.',
    keyRules: [
      { syntax: 'name = value', meaning: 'Attaches a name tag to an object with a unique id()' },
      { syntax: 'a, b = b, a', meaning: 'Swaps two variables cleanly via tuple unpacking' },
      { syntax: 'top, *rest = xs', meaning: 'Starred unpacking collects remaining items into a list' },
      { syntax: 'snake_case / ALL_CAPS', meaning: 'Standard styles for variables and constants' },
    ],
    commonTraps: [
      'Starting a name with a digit (1st_score), adding spaces, hyphens (-), or using keywords like class.',
      'Shadowing built-ins (list = [1, 2] or print = "hi") breaks later built-in calls.',
      'Unpacking mismatch (a, b = [1, 2, 3] without *rest) raises ValueError.',
    ],
    classroomDemoCode: `fare_a = 500\nfare_b = fare_a\nprint("Shared id?", id(fare_a) == id(fare_b))\nfare_b = 750\nprint("After rebind:", fare_a, fare_b, "| Same id?", id(fare_a) == id(fare_b))`,
    discussionPrompts: [
      'Why does changing fare_b = 750 leave fare_a at 500, whereas mutating a shared list affects both names?',
      'Which built-in words do learners accidentally overwrite most often in class?',
    ],
  },
  {
    moduleId: 'module-b',
    code: 'Module B',
    title: 'print() Pipeline',
    bigIdea: 'print() formats any number of objects into text using sep between items, end at the finish, and f-strings for alignment and decimals.',
    keyRules: [
      { syntax: 'print(a, b, sep="-")', meaning: 'Inserts "-" between arguments instead of space' },
      { syntax: 'print("Hi", end=" ")', meaning: 'Stays on the same line instead of adding \\n' },
      { syntax: 'f"{amt:,.2f}"', meaning: 'Formats numbers with comma separators & 2 decimal places' },
      { syntax: 'r"C:\\notes\\new"', meaning: 'Raw string keeps backslashes literally without escaping' },
    ],
    commonTraps: [
      'Writing x = print("Hello") stores None in x because print() displays text and returns None.',
      'Forgetting the leading f in "Total: {total}" prints literal curly braces.',
      'Expecting Windows paths in normal quotes to avoid \\n or \\t interpretation.',
    ],
    classroomDemoCode: `item, qty, unit = "Jollof", 2, 1850.5\nprint(f"{item:<10} x{qty:<2} -> ₦{qty * unit:>8,.2f}")\nprint("Status:", "Paid", sep=" ", end=" [OK]\\n")`,
    discussionPrompts: [
      'How would a supermarket POS receipt break if sep and end defaulted to the same character?',
      'Why does print() return None rather than returning the printed string?',
    ],
  },
  {
    moduleId: 'module-c',
    code: 'Module C',
    title: 'input() & Type Conversion',
    bigIdea: 'input() ALWAYS returns a str — keep identifiers like phone numbers as str, and cast numeric inputs explicitly with try/except guards.',
    keyRules: [
      { syntax: 'input("Prompt: ").strip()', meaning: 'Reads user text as str and trims stray whitespace' },
      { syntax: 'int(raw) / float(raw)', meaning: 'Converts valid numeric strings for arithmetic' },
      { syntax: 'try: ... except ValueError:', meaning: 'Catches bad typing politely instead of crashing' },
      { syntax: 'reply.strip().lower() == "yes"', meaning: 'Safe case-insensitive command matching' },
    ],
    commonTraps: [
      'Multiplying un-converted input ("5" * 3 -> "555") creates a silent logic bug.',
      'Converting phone numbers or ATM PINs ("0803...") to int strips the leading 0.',
      'Using bool("False") expecting False — any non-empty string is True!',
    ],
    classroomDemoCode: `raw_phone = "08031234567"\nraw_fare = "450"\nprint("Kept as str:", raw_phone, "| Fare x 2:", int(raw_fare) * 2)`,
    discussionPrompts: [
      'Why is "5" * 3 producing "555" often harder to notice than a TypeError crash?',
      'Which real-world Nigerian numbers should ALWAYS stay strings (phone, JAMB ID, NIN, PIN)?',
    ],
  },
  {
    moduleId: 'module-d1',
    code: 'Module D1',
    title: 'Numbers, Bool & NoneType',
    bigIdea: 'Choose int for exact counts and kobo money, float for measurements (using isclose for checks), bool for True/False logic, and None for "not yet set".',
    keyRules: [
      { syntax: 'a / b  vs  a // b  vs  a % b', meaning: '/ always returns float; // floor int; % remainder' },
      { syntax: 'divmod(total, 500)', meaning: 'Returns (quotient, remainder) in one tuple' },
      { syntax: 'val is None', meaning: 'Checks explicitly for the None sentinel (unlike 0)' },
      { syntax: '(4.0).is_integer() / math.isclose()', meaning: 'Float inspection and safe tolerance comparisons' },
    ],
    commonTraps: [
      'Expecting 0.1 + 0.2 == 0.3 in binary floating point without rounding or kobo ints.',
      'Using "if not score:" treats a genuine score of 0 the same as None (ungraded).',
      'Confusing ^ (bitwise XOR) with ** (exponentiation).',
    ],
    classroomDemoCode: `notes, change = divmod(1850, 500)\nprint(f"Notes: {notes}, Change: ₦{change}")\nprint("0.1 + 0.2 float:", 0.1 + 0.2, "| math.isclose?", round(0.1 + 0.2, 2) == 0.3)`,
    discussionPrompts: [
      'Why does Nigerian fintech store transactions in integer kobo rather than Naira floats?',
      'Explain a scenario where 0 and None mean two completely different things.',
    ],
  },
  {
    moduleId: 'module-d2',
    code: 'Module D2',
    title: 'Strings (str) & Methods',
    bigIdea: 'Strings are immutable Unicode sequences indexed from 0 (and -1 from the end); every string method returns a new string.',
    keyRules: [
      { syntax: 's[start:stop:step]', meaning: 'Extracts substrings cleanly; s[::-1] reverses' },
      { syntax: '.strip() / .title() / .upper()', meaning: 'Normalises messy user text into a new string' },
      { syntax: '.split() / sep.join(items)', meaning: 'Splits text into a list or joins strings back together' },
      { syntax: '.find() / .replace() / .removeprefix()', meaning: 'Safe -1 search and clean substring edits' },
    ],
    commonTraps: [
      'Calling s.upper() without saving the return value leaves s unchanged.',
      'Attempting s[0] = "B" raises TypeError because strings are immutable.',
      'Using .index() instead of .find() crashes with ValueError when absent.',
    ],
    classroomDemoCode: `raw = "  amaka okafor  "\nclean = raw.strip().title()\nprint(clean, "| Initials:", clean.split()[0][0] + "." + clean.split()[1][0])`,
    discussionPrompts: [
      'Why does "lagos".upper() return a new string instead of changing the old string in place?',
      'What happens when you call .split(" ") vs .split() on "Ada  Bola"?',
    ],
  },
  {
    moduleId: 'module-d3',
    code: 'Module D3',
    title: 'Lists, Tuples & Ranges',
    bigIdea: 'Use mutable lists for changing queues, immutable tuples for fixed coordinates/records, and lazy range() sequences for integer arithmetic progression.',
    keyRules: [
      { syntax: '.append() / .extend() / .pop()', meaning: 'Mutate lists in place while preserving object id()' },
      { syntax: 'sorted(xs)  vs  xs.sort()', meaning: 'sorted() returns a new list; .sort() returns None' },
      { syntax: 'single = (42,)', meaning: 'Trailing comma is required for a 1-item tuple' },
      { syntax: 'range(start, stop, step)', meaning: 'Lazy O(1)-memory integer sequence with slicing support' },
    ],
    commonTraps: [
      'Assigning result = items.sort() puts None in result.',
      'Writing (42) instead of (42,) creates an int, not a tuple.',
      'Passing a float into range(0, 5, 0.5) raises TypeError.',
    ],
    classroomDemoCode: `coords = (9.0765, 7.3986)\nqueue = ["Ada", "Bola"]\nqueue.append("Chidi")\nfor pos, name in enumerate(queue, 1):\n    print(pos, name, "| GPS:", coords)`,
    discussionPrompts: [
      'Why can a tuple act as a dictionary key when a list cannot?',
      'Why does range(1_000_000) take almost zero extra memory compared to list(range(1_000_000))?',
    ],
  },
  {
    moduleId: 'module-d4',
    code: 'Module D4',
    title: 'Dicts, Sets & Bytes',
    bigIdea: 'Dictionaries map unique hashable keys to values; sets perform fast deduplication and Venn algebra; bytes/bytearray handle raw 0..255 binary data.',
    keyRules: [
      { syntax: 'd.get(k, default) / d.items()', meaning: 'Safe key lookup and clean (key, value) looping' },
      { syntax: 'set() vs {}', meaning: 'Always use set() for an empty set; {} creates a dict' },
      { syntax: 'a | b, a & b, a - b, a ^ b', meaning: 'Set union, intersection, difference & symmetric diff' },
      { syntax: 's.encode("utf-8") / bytearray', meaning: 'Convert str <-> bytes and edit mutable byte buffers' },
    ],
    commonTraps: [
      'Writing empty = {} expecting an empty set — calling .add() raises AttributeError on dict!',
      'Nesting a mutable list or set as a dict key or set member raises unhashable TypeError.',
      'Trying to mutate b"ABC"[0] = 88 directly on immutable bytes instead of bytearray.',
    ],
    classroomDemoCode: `student = {"name": "Amaka", "score": 92}\nprint("Safe phone:", student.get("phone", "None"))\npkt = "₦500".encode("utf-8")\nprint("Hex:", pkt.hex(), "| Decoded:", pkt.decode("utf-8"))`,
    discussionPrompts: [
      'Why does b"ABC"[0] return 65 instead of "A"?',
      'When do you need frozenset instead of set?',
    ],
  },
  {
    moduleId: 'module-e',
    code: 'Module E',
    title: 'Conversions, Ops & Mutability',
    bigIdea: 'Know when conversions succeed cleanly, how operators adapt to types (== vs is), and how aliasing differs from shallow and deep copying.',
    keyRules: [
      { syntax: 'int(float("4.5"))', meaning: 'Two-step bridge for decimal strings to whole integers' },
      { syntax: '==  vs  is', meaning: '== checks equal values; is checks identical object id()' },
      { syntax: 'a.copy() vs copy.deepcopy(a)', meaning: 'Shallow copies 1 level; deepcopy isolates nested containers' },
      { syntax: 'kobo (int) / tuple / set / dict', meaning: 'Match mutability, uniqueness & lookup requirements' },
    ],
    commonTraps: [
      'Writing backup = original on a list creates an alias sharing the same memory id().',
      'Calling a.copy() on nested lists leaves inner lists shared.',
      'Assuming bool("False") becomes False or 10 / 2 returns an int.',
    ],
    classroomDemoCode: `import copy\nledger = [["Ada", 88], ["Bola", 91]]\ndeep = copy.deepcopy(ledger)\ndeep[0][1] = 100\nprint("Original:", ledger, "| Deep:", deep)`,
    discussionPrompts: [
      'Walk through an example bug caused by b = a aliasing vs copy.copy() vs copy.deepcopy().',
      'Which Python type would you pick for 10,000 unique JAMB IDs, and why?',
    ],
  },
];
