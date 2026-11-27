import { LessonDefinition, PrintPerfectLevel } from '../types/lab';

export const MODULE_B_LESSONS: LessonDefinition[] = [
  {
    id: 'b1-print-pipeline',
    moduleId: 'module-b',
    number: 'B1',
    title: 'How print() Works (The 6-Step Pipeline)',
    subtitle: 'Arguments, str(), sep, end, file & flush',
    scenarioTitle: 'Mama Ngozi Provision Shop Printer',
    sceneType: 'print-pipeline',
    starterCode: `# Signature: print(*objects, sep=' ', end='\\n', file=sys.stdout, flush=False)
item = "Peak Milk"
qty = 3
price = 450

print(item, "x", qty, "= ₦", qty * price)
print()  # Empty print() outputs a blank line!
print("Thank", "you", sep="-", end="!!\\n")
print("Same", end=" ")
print("line!")`,
    predict: {
      prompt: 'What does print("Thank", "you", sep="-", end="!!\\n") output?',
      options: [
        'Thank-you!!',
        'Thank you!!',
        'Thank-you\\n!!',
        'Thank - you !!',
      ],
      correctIndex: 0,
      explanation:
        'sep="-" replaces the default space between arguments with "-", and end="!!\\n" puts "!!" plus a newline at the end.',
    },
    realLifeUses: [
      {
        context: 'Supermarket Till',
        title: 'Printing item lines & totals',
        description: 'sep=" | " neatly separates product names, quantities, and naira amounts on receipts.',
      },
      {
        context: 'Loading Progress',
        title: 'Staying on one line with end=""',
        description: 'Using end="" or end=" " lets a program print "Loading..." dots onto the exact same line.',
      },
      {
        context: 'School Server Logs',
        title: 'Sending errors to sys.stderr',
        description: 'Programs send normal messages to sys.stdout and urgent warnings to file=sys.stderr.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-b1-1',
        title: 'Python 2 style print without brackets',
        badCode: `print "Hello Lagos"`,
        errorLabel: 'SyntaxError',
        explanation: 'In Python 3, print is a function and MUST have parentheses around its arguments.',
        fixedCode: `print("Hello Lagos")`,
      },
      {
        id: 'm-b1-2',
        title: 'Mixing str + int with + instead of commas',
        badCode: `age = 15\nprint("Age: " + age)`,
        errorLabel: 'TypeError',
        explanation: 'Commas convert each item with str() automatically, whereas + refuses to glue text to an integer.',
        fixedCode: `age = 15\nprint("Age:", age)`,
      },
    ],
    conceptsCounted: ['print-pipeline', 'sep-and-end', 'blank-line'],
  },
  {
    id: 'b2-formatting-receipt',
    moduleId: 'module-b',
    number: 'B2',
    title: 'f-strings, .format(), % & Receipt Printing',
    subtitle: 'Format specs, repetition & printing collections',
    scenarioTitle: 'Shop Receipt Printer',
    sceneType: 'receipt-printer',
    starterCode: `shop = "Zaria Mart"
price = 2500.5
receipt_no = 42
pass_rate = 0.875
item = "Rice"

print("=" * 30)
print(f"{shop:^30}")
print("=" * 30)
print(f"Receipt #{receipt_no:05d}")
print(f"{item:>10}: ₦{price:,.2f}")
print(f"Discount rate: {pass_rate:.1%}")
print("{} costs ₦{:.2f}".format("Beans", 1800))
print("Code %s | Qty %03d" % ("NG-1", 7))`,
    predict: {
      prompt: 'What does f"#{42:05d}" produce?',
      options: ['#00042', '#42000', '#42.00000', '#   42'],
      correctIndex: 0,
      explanation:
        ':05d pads the integer 42 with leading zeros so it takes up 5 digits total: 00042.',
    },
    realLifeUses: [
      {
        context: 'POS Receipt',
        title: 'Currency formatting with :,.2f',
        description: 'Turns 12500.5 into 12,500.50 with clean thousands commas and 2 decimal places.',
      },
      {
        context: 'Invoice Numbering',
        title: 'Zero-padded IDs with :05d',
        description: 'Turns order 42 into 00042 so every receipt code has equal width.',
      },
      {
        context: 'Exam Statistics',
        title: 'Percentages with :.1%',
        description: 'Automatically multiplies 0.875 by 100 and prints 87.5%.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-b2-1',
        title: 'Forgetting the f before an f-string',
        badCode: `price = 500\nprint("Cost: {price}")`,
        errorLabel: 'Logic Bug',
        explanation: 'Without the leading f, Python prints the literal curly braces {price} instead of 500!',
        fixedCode: `price = 500\nprint(f"Cost: {price}")`,
      },
      {
        id: 'm-b2-2',
        title: 'Mismatched or unclosed quotes',
        badCode: `print("Receipt ready')`,
        errorLabel: 'SyntaxError',
        explanation: 'A string that starts with double quote " must end with double quote ".',
        fixedCode: `print("Receipt ready")`,
      },
    ],
    conceptsCounted: ['f-strings', 'format-specs', 'format-and-percent'],
  },
  {
    id: 'b3-escapes-streams-unpack',
    moduleId: 'module-b',
    number: 'B3',
    title: 'Escapes, Raw Strings, Collections & Streams',
    subtitle: '\\n, \\t, r"...", *unpacking, stderr & flush',
    scenarioTitle: 'Term 2 Report-Card Printout',
    sceneType: 'report-card',
    starterCode: `import sys

# Escape sequences & raw strings
print("Subject\\tScore\\tGrade")
print("Maths\\t92\\tA1")
print(r"Folder: C:\\Users\\Student\\notes")

# Triple-quoted multi-line card
card = """--- REPORT ---
Term: Second Term
Status: Promoted"""
print(card)

# Unpacking & collections
scores = [88, 92, 79]
print("Scores:", *scores, sep=" | ")
print("Type:", type(scores))
print("Loading...", end="", flush=True)
print(" Done!")
print("Notice: Check Maths lab book", file=sys.stderr)`,
    predict: {
      prompt: 'What does print("A", *[10, 20, 30], sep="-") print?',
      options: [
        'A-10-20-30',
        'A-[10, 20, 30]',
        'A-10 20 30',
        'TypeError',
      ],
      correctIndex: 0,
      explanation:
        'The * unpacks [10, 20, 30] into three separate arguments: print("A", 10, 20, 30, sep="-"), joining all four with "-".',
    },
    realLifeUses: [
      {
        context: 'School Report Card',
        title: 'Aligned columns with \\t',
        description: 'Tab stops (\\t) and triple-quoted templates lay out clean report-card summaries.',
      },
      {
        context: 'Windows File Paths',
        title: 'Raw strings r"C:\\new\\file"',
        description: 'Prefixing r avoids turning \\n inside a folder path into an accidental newline.',
      },
      {
        context: 'Diagnostic Warnings',
        title: 'Separating sys.stderr from sys.stdout',
        description: 'Error logs go to sys.stderr so they do not corrupt normal output files.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-b3-1',
        title: 'Unescaped backslash in a normal path string',
        badCode: `print("C:\\new_folder\\test")`,
        errorLabel: 'Logic Bug',
        explanation: '\\n turns into a newline and \\t turns into a tab! Use r"..." for raw paths.',
        fixedCode: `print(r"C:\\new_folder\\test")`,
      },
      {
        id: 'm-b3-2',
        title: 'Forgetting to import sys before file=sys.stderr',
        badCode: `print("Warning!", file=sys.stderr)`,
        errorLabel: 'NameError',
        explanation: 'You must run import sys before referencing sys.stderr.',
        fixedCode: `import sys\nprint("Warning!", file=sys.stderr)`,
      },
    ],
    conceptsCounted: ['escapes-and-raw', 'print-unpacking', 'stderr-and-flush'],
  },
];

export const PRINT_PERFECT_LEVELS: PrintPerfectLevel[] = [
  {
    id: 'pp-1',
    title: 'Level 1: Tuck Shop Separator',
    targetOutput: 'Meat Pie | Egg Roll | Puff Puff',
    hint: 'Pass three strings to print(...) and set sep=" | ".',
    starterCode: `print("Meat Pie", "Egg Roll", "Puff Puff")`,
  },
  {
    id: 'pp-2',
    title: 'Level 2: Stay on One Line',
    targetOutput: 'Loading... Done!',
    hint: 'Set end="" (or end=" ") on the first print() so the second print stays on the same line.',
    starterCode: `print("Loading...")\nprint("Done!")`,
  },
  {
    id: 'pp-3',
    title: 'Level 3: Naira Price Tag',
    targetOutput: 'Total: ₦2,500.00',
    hint: 'Use an f-string with the :,.2f format specifier on price = 2500.',
    starterCode: `price = 2500\nprint(f"Total: ₦{price}")`,
  },
  {
    id: 'pp-4',
    title: 'Level 4: Padded Receipt ID',
    targetOutput: 'ID: 00007',
    hint: 'Use :05d inside an f-string to pad 7 to 5 digits.',
    starterCode: `n = 7\nprint(f"ID: {n}")`,
  },
  {
    id: 'pp-5',
    title: 'Level 5: Unpacked Countdown',
    targetOutput: '3->2->1->Go!',
    hint: 'Unpack nums = [3, 2, 1] with *nums and pass "Go!" with sep="->".',
    starterCode: `nums = [3, 2, 1]\nprint(nums, "Go!")`,
  },
];
