import { InputDetectiveCase, LessonDefinition } from '../types/lab';

export const MODULE_C_LESSONS: LessonDefinition[] = [
  {
    id: 'c1-how-input-works',
    moduleId: 'module-c',
    number: 'C1',
    title: 'How input() Works & Method Chaining',
    subtitle: 'Blocking pause, always returns str, .strip() & .title()',
    scenarioTitle: 'School Registration Form Desk',
    sceneType: 'input-pipeline',
    starterCode: `# Signature: input(prompt='') -> ALWAYS returns a str!
raw_name = input("Enter student name: ")
clean_name = raw_name.strip().title()

house = input("School house (red/blue): ").strip().lower()
print(f"Welcome, {clean_name}! Assigned house: {house}")
print("Return type of input():", type(raw_name))`,
    predict: {
      prompt: 'If a learner types 14 into age = input("Age: "), what is type(age)?',
      options: [
        "<class 'str'> — input() ALWAYS returns a string",
        "<class 'int'> — because 14 is a whole number",
        "<class 'float'>",
        'Depends on the prompt',
      ],
      correctIndex: 0,
      explanation:
        'input() always strips the Enter newline and returns a str, even when the user types digits like 14 or 3.5!',
    },
    realLifeUses: [
      {
        context: 'School Portal',
        title: 'Cleaning messy typing with .strip().title()',
        description: 'If a student types "  ada obi  ", chaining .strip().title() neatly cleans it to "Ada Obi".',
      },
      {
        context: 'USSD / CLI Menus',
        title: 'Case-insensitive choices with .lower()',
        description: 'Turning "YES" or "Yes" into "yes" ensures menu checks match reliably.',
      },
      {
        context: 'Interactive Quizzes',
        title: 'Pausing until the user presses Enter',
        description: 'input() blocks execution cleanly so the learner controls the pace.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-c1-1',
        title: 'Adding two input() strings ("5" + "5" -> "55")',
        badCode: `a = input("First number: ")\nb = input("Second number: ")\nprint("Sum:", a + b)`,
        errorLabel: 'Logic Bug',
        explanation: 'Because input() returns str, "5" + "5" joins the text to make "55" instead of 10!',
        fixedCode: `a = int(input("First number: "))\nb = int(input("Second number: "))\nprint("Sum:", a + b)`,
      },
      {
        id: 'm-c1-2',
        title: 'Comparing str input directly with an int',
        badCode: `pin = input("Enter PIN: ")\nif pin == 1234:\n    print("Access granted")\nelse:\n    print("Wrong PIN (str != int)")`,
        errorLabel: 'Logic Bug',
        explanation: '"1234" (str) is NEVER equal to 1234 (int) in Python! Convert with int() or compare with "1234".',
        fixedCode: `pin = input("Enter PIN: ")\nif pin == "1234":\n    print("Access granted")`,
      },
    ],
    conceptsCounted: ['input-pipeline', 'always-str', 'method-chaining'],
  },
  {
    id: 'c2-converting-validating',
    moduleId: 'module-c',
    number: 'C2',
    title: 'Converting & Validating input()',
    subtitle: 'int(input()), float(input()), .isdigit() & try/except',
    scenarioTitle: 'ATM PIN Check & Age Calculator',
    sceneType: 'atm-pin',
    starterCode: `# Converting input safely with .isdigit() and try/except
birth_text = input("Year of birth (e.g. 2011): ").strip()

if birth_text.isdigit():
    age = 2026 - int(birth_text)
    print(f"You turn {age} in 2026!")
else:
    print("Please enter digits only.")

# Using try / except for decimal amounts (Simple Interest)
try:
    principal = float(input("Savings amount (₦): "))
    interest = principal * 0.05 * 2
    print(f"2-year 5% interest: ₦{interest:,.2f}")
except ValueError:
    print("That wasn't a valid number — no crash!")`,
    predict: {
      prompt: 'What error occurs if int(input("Qty: ")) runs and the user types "abc"?',
      options: ['ValueError', 'TypeError', 'NameError', 'SyntaxError'],
      correctIndex: 0,
      explanation:
        '"abc" is the right type (str), so it is not a TypeError — its value just cannot be read as a base-10 integer, raising ValueError.',
    },
    realLifeUses: [
      {
        context: 'ATM / Mobile Banking',
        title: 'Validating PINs & transfer amounts',
        description: 'Checking .isdigit() or catching ValueError prevents the ATM app from crashing on bad input.',
      },
      {
        context: 'Simple Interest Calculator',
        title: 'Using float(input()) for money & rates',
        description: 'Allows decimals like 1500.50 naira or 7.5% interest.',
      },
      {
        context: 'Age & Exam Eligibility',
        title: 'Converting birth year with int()',
        description: 'Turns the user string "2010" into a number so subtraction works.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-c2-1',
        title: 'Crashing when user types letters into int(input())',
        badCode: `qty = int(input("How many meat pies? "))\nprint("Total:", qty * 500)`,
        errorLabel: 'ValueError',
        explanation: 'If someone types "two" instead of "2", int("two") raises ValueError unless wrapped in try/except or checked with .isdigit().',
        fixedCode: `raw = input("How many meat pies? ").strip()\nif raw.isdigit():\n    print("Total:", int(raw) * 500)\nelse:\n    print("Please type digits like 2")`,
      },
    ],
    conceptsCounted: ['int-float-conversion', 'isdigit-check', 'try-except-input'],
  },
  {
    id: 'c3-multiple-and-loops',
    moduleId: 'module-c',
    number: 'C3',
    title: 'Multiple Inputs & input() in Loops',
    subtitle: 'split(), unpacking, map(int, ...) & till loop',
    scenarioTitle: 'Tuck Shop Multi-Item Till',
    sceneType: 'registration-form',
    starterCode: `# Multiple inputs on one line!
first, last = input("First and last name (space-separated): ").split()
print(f"Student: {last.upper()}, {first.title()}")

# Converting multiple numbers in one line
scores = list(map(int, input("Enter 3 test scores (e.g. 75 82 90): ").split()))
print("Scores:", scores, "| Average:", round(sum(scores) / len(scores), 1))

# Repeating input inside a loop
total = 0
for i in range(2):
    price = float(input(f"Item {i + 1} price (₦): "))
    total += price
print(f"Grand total: ₦{total:,.2f}")`,
    predict: {
      prompt: 'If the user types "10 20 30" into list(map(int, input().split())), what do you get?',
      options: [
        '[10, 20, 30] (a list of ints)',
        "['10', '20', '30'] (a list of strings)",
        '(10, 20, 30)',
        'TypeError',
      ],
      correctIndex: 0,
      explanation:
        '.split() breaks "10 20 30" into ["10", "20", "30"], map(int, ...) converts each string to an int, and list(...) collects [10, 20, 30].',
    },
    realLifeUses: [
      {
        context: 'Exam Marks Entry',
        title: 'Entering CA1, CA2 and Exam together',
        description: 'list(map(int, input().split())) reads space-separated test scores in one shot.',
      },
      {
        context: 'Tuck Shop Checkout',
        title: 'Looping over items',
        description: 'Asking for item prices inside a for or while loop builds up a running total.',
      },
      {
        context: 'Registration Form',
        title: 'Splitting first & surname',
        description: 'first, last = input().split() cleanly separates two words typed on one line.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-c3-1',
        title: 'Typing 3 words when unpacking into 2 names',
        badCode: `first, last = input("Full name: ").split()`,
        errorLabel: 'ValueError',
        explanation: 'If the user types 3 names ("Ada Ngozi Obi"), unpacking into 2 variables fails with ValueError.',
        fixedCode: `parts = input("Full name: ").split()\nprint("Names:", parts)`,
      },
    ],
    conceptsCounted: ['split-input', 'map-int-input', 'input-in-loops'],
  },
];

export const INPUT_DETECTIVE_CASES: InputDetectiveCase[] = [
  {
    id: 'id-1',
    title: 'Case 1: The Double Naira Bug',
    context: 'Tuck Shop Till',
    buggyCode: `a = input("Meat pie price: ")
b = input("Drink price: ")
print("Total:", a + b)`,
    sampleInput: '500 and 300',
    actualOutput: 'Total: 500300',
    expectedOutput: 'Total: 800',
    options: [
      'input() returned strings, so + glued "500" and "300" into "500300"',
      'print() added an extra zero by mistake',
      'Variables a and b cannot hold 3-digit numbers',
      'Missing sep="+" inside print()',
    ],
    correctIndex: 0,
    explanation:
      'input() always returns a str. Using + on two strings concatenates them instead of adding numbers. Wrap each input() in int() or float()!',
    fixedCode: `a = int(input("Meat pie price: "))\nb = int(input("Drink price: "))\nprint("Total:", a + b)`,
  },
  {
    id: 'id-2',
    title: 'Case 2: The Locked ATM Door',
    context: 'ATM PIN Check',
    buggyCode: `pin = input("Enter 4-digit PIN: ")
if pin == 1234:
    print("Welcome!")
else:
    print("Wrong PIN")`,
    sampleInput: '1234',
    actualOutput: 'Wrong PIN',
    expectedOutput: 'Welcome!',
    options: [
      'Comparing str "1234" against int 1234 is always False',
      '== cannot be used inside an if statement',
      'input() scrambled the digits',
      '1234 is a Python keyword',
    ],
    correctIndex: 0,
    explanation:
      'pin holds the string "1234", while 1234 is an integer. In Python, "1234" == 1234 evaluates to False. Compare against "1234" or convert with int(pin).',
    fixedCode: `pin = input("Enter 4-digit PIN: ")\nif pin == "1234":\n    print("Welcome!")\nelse:\n    print("Wrong PIN")`,
  },
  {
    id: 'id-3',
    title: 'Case 3: The Space-Breaking Answer',
    context: 'Quiz Checker',
    buggyCode: `ans = input("Capital of Nigeria: ")
if ans == "Abuja":
    print("Correct!")
else:
    print("Try again")`,
    sampleInput: '  abuja ',
    actualOutput: 'Try again',
    expectedOutput: 'Correct!',
    options: [
      'Leading/trailing spaces and lowercase letters did not match "Abuja"',
      'input() deleted the letter A',
      'Strings cannot contain spaces',
      'if should be while',
    ],
    correctIndex: 0,
    explanation:
      'Users often accidentally add spaces or type lowercase ("  abuja "). Chain .strip().title() or .strip().lower() onto input()!',
    fixedCode: `ans = input("Capital of Nigeria: ").strip().lower()\nif ans == "abuja":\n    print("Correct!")\nelse:\n    print("Try again")`,
  },
  {
    id: 'id-4',
    title: 'Case 4: The Decimal Crash',
    context: 'Simple Interest Calculator',
    buggyCode: `rate = int(input("Interest rate (%): "))
print("Rate:", rate)`,
    sampleInput: '7.5',
    actualOutput: 'ValueError: invalid literal for int()',
    expectedOutput: 'Rate: 7.5',
    options: [
      'int() rejects decimal points in strings like "7.5"; float() is needed',
      'input() cannot read the dot "." character',
      'The variable name "rate" is reserved',
      '7.5 is too small for int()',
    ],
    correctIndex: 0,
    explanation:
      'int("7.5") raises ValueError because "7.5" contains a decimal point. Use float(input(...)) whenever decimals are expected.',
    fixedCode: `rate = float(input("Interest rate (%): "))\nprint("Rate:", rate)`,
  },
  {
    id: 'id-5',
    title: 'Case 5: The Unsorted Scores',
    context: 'Report Card Builder',
    buggyCode: `scores = input("Enter 3 scores: ").split()
print("Highest:", max(scores))`,
    sampleInput: '9 85 100',
    actualOutput: 'Highest: 9',
    expectedOutput: 'Highest: 100',
    options: [
      '.split() returned strings, and alphabetically "9" comes after "85" and "100"',
      'max() always picks the first item in a list',
      '.split() reversed the list',
      '100 is not allowed in split()',
    ],
    correctIndex: 0,
    explanation:
      'Without map(int, ...), scores is ["9", "85", "100"] (strings!). Python compares strings character-by-character ("9" > "1"), so convert them to ints first.',
    fixedCode: `scores = list(map(int, input("Enter 3 scores: ").split()))\nprint("Highest:", max(scores))`,
  },
];
