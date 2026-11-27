import { LessonDefinition, MethodExplorerEntry } from '../types/lab';

export const MODULE_D2_LESSONS: LessonDefinition[] = [
  {
    id: 'd2-1-strings-indexing-slicing',
    moduleId: 'module-d2',
    number: 'D2.1',
    title: 'Strings (str): Characters, Indexing & Slicing',
    subtitle: '0-based & negative indices, [start:stop:step], reversal & len()',
    scenarioTitle: 'WAEC Exam Number Decoder',
    sceneType: 'str-index-tape',
    starterCode: `# Strings are ordered, IMMUTABLE sequences of Unicode characters
exam_id = "NG-2026-WAEC"

print("Total characters:", len(exam_id))
print("First char [0]:", exam_id[0], "| Last char [-1]:", exam_id[-1])

# Slicing [start:stop] — stop index is NOT included!
country = exam_id[0:2]
year = exam_id[3:7]
board = exam_id[8:]
reversed_id = exam_id[::-1]

print(f"Country: {country} | Year: {year} | Board: {board}")
print("Reversed:", reversed_id)
print("Contains 'WAEC'?", "WAEC" in exam_id)`,
    predict: {
      prompt: 'If code = "LAGOS", what does code[1:4] return?',
      options: ['"AGO"', '"LAGO"', '"AGOS"', '"LAG"'],
      correctIndex: 0,
      explanation:
        'Python slicing includes start (index 1 = "A") up to, but NOT including, stop (index 4 = "S"). So indices 1, 2, 3 give "AGO".',
    },
    realLifeUses: [
      {
        context: 'Exam & Bank Codes',
        title: 'Extracting fields by position',
        description: 'Slicing pulls out state codes, year prefixes, or last 4 card digits cleanly.',
      },
      {
        context: 'SMS & Chat Previews',
        title: 'Shortening long headlines with [:40]',
        description: 'Slicing beyond the length of a string never crashes — it simply stops at the end.',
      },
      {
        context: 'Palindrome Checks',
        title: 'Reversing text with [::-1]',
        description: 'Step -1 walks backwards from the last character to index 0 in a single expression.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-d2-str-1',
        title: 'Trying to edit a character in place (s[0] = "X")',
        badCode: `city = "lagos"\ncity[0] = "L"`,
        errorLabel: 'TypeError',
        explanation: 'Strings are IMMUTABLE! You cannot change one letter in place — build a new string instead.',
        fixedCode: `city = "lagos"\ncity = "L" + city[1:]\nprint(city)`,
      },
      {
        id: 'm-d2-str-2',
        title: 'Off-by-one IndexError on positive index',
        badCode: `word = "ZOBO"\nprint(word[4])`,
        errorLabel: 'IndexError',
        explanation: 'A 4-letter string has indices 0, 1, 2, 3. Index 4 is past the end — use word[-1] for the last letter.',
        fixedCode: `word = "ZOBO"\nprint("Last letter:", word[-1])`,
      },
    ],
    conceptsCounted: ['str-indexing', 'str-slicing', 'str-immutability'],
  },
  {
    id: 'd2-2-case-cleaning-checks',
    moduleId: 'module-d2',
    number: 'D2.2',
    title: 'Case, Cleaning & Character Checks',
    subtitle: '.strip(), .upper(), .title(), .removeprefix(), .isdigit() & .startswith()',
    scenarioTitle: 'School Portal Phone & Name Cleaner',
    sceneType: 'str-cleaner',
    starterCode: `raw_name = "   amaka  okafor  "
raw_phone = "+234-08031234567"

clean_name = raw_name.strip().title()
local_phone = raw_phone.removeprefix("+234-").strip()

print("Cleaned name:", repr(clean_name))
print("Local phone:", local_phone)
print("Is digits only?", local_phone.isdigit())
print("Starts with 080?", local_phone.startswith("080"))
print("Swapcase demo:", "Naija Tech".swapcase())`,
    predict: {
      prompt: 'After text = "  hello  "; text.strip(), what is the value of text?',
      options: [
        '"  hello  " — .strip() returns a NEW string and leaves text unchanged',
        '"hello" — .strip() edits text in place',
        'None',
        'TypeError',
      ],
      correctIndex: 0,
      explanation:
        'Because str is immutable, every string method returns a brand-new string! You must save the result (text = text.strip()) to keep it.',
    },
    realLifeUses: [
      {
        context: 'Nigerian Phone Numbers',
        title: 'Normalising +234 and 080 prefixes',
        description: '.removeprefix("+234") and .startswith(("080", "081", "090")) validate phone numbers.',
      },
      {
        context: 'Student Names',
        title: 'Cleaning form typos with .strip().title()',
        description: 'Removes accidental spaces around typed names and capitalises words consistently.',
      },
      {
        context: 'Password & PIN Validation',
        title: 'Checking digits & letters with .isdigit() / .isalnum()',
        description: 'Ensures PINs contain only digits or usernames contain only letters and numbers.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-d2-str-3',
        title: 'Forgetting to assign the return value of a str method',
        badCode: `name = "  tunde  "\nname.strip()\nprint(repr(name))`,
        errorLabel: 'Logic Bug',
        explanation: 'Calling name.strip() without assigning name = name.strip() throws away the cleaned string!',
        fixedCode: `name = "  tunde  "\nname = name.strip().title()\nprint(repr(name))`,
      },
    ],
    conceptsCounted: ['str-cleaning', 'str-case', 'str-predicates'],
  },
  {
    id: 'd2-3-searching-replacing',
    moduleId: 'module-d2',
    number: 'D2.3',
    title: 'Searching, Counting & Aligning Text',
    subtitle: '.find() vs .index(), .count(), .replace(), .center() & .zfill()',
    scenarioTitle: 'Class Broadcast Notice Formatter',
    sceneType: 'str-search-replace',
    starterCode: `notice = "Maths class moves to Lab 2. Bring Maths workbook!"

print("Occurrences of 'Maths':", notice.count("Maths"))
print("First 'Lab' index:", notice.find("Lab"))
print("Missing 'Bio' with find():", notice.find("Bio"))

updated = notice.replace("Maths", "Physics", 1)
print("Replaced 1st only:", updated)

badge_num = "42".zfill(5)
banner = "JSS3 NOTICE".center(25, "-")
print(banner)
print("Ticket:", badge_num)`,
    predict: {
      prompt: 'What is the difference between "Lagos".find("x") and "Lagos".index("x")?',
      options: [
        '.find() returns -1 safely; .index() raises ValueError',
        '.find() raises ValueError; .index() returns -1',
        'Both return None',
        'Both return 0',
      ],
      correctIndex: 0,
      explanation:
        'Use .find() when the word might be absent (you get -1). Use .index() when the word MUST exist and its absence is an error.',
    },
    realLifeUses: [
      {
        context: 'Receipt & Ticket Alignment',
        title: 'Padding IDs & banners with .zfill() and .center()',
        description: 'Zero-pads ticket "42" -> "00042" and centres headers neatly in terminal receipts.',
      },
      {
        context: 'Message Templates',
        title: 'Swapping placeholders with .replace()',
        description: 'Replaces template words or swaps the first N matches using the optional count argument.',
      },
      {
        context: 'Email & URL Parsing',
        title: 'Locating "@" or "." with .find() / .rfind()',
        description: 'Finds the exact index of "@" inside an email address to extract username and domain.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-d2-str-4',
        title: 'Calling .index() on a missing substring without try/except',
        badCode: `email = "ada_school.ng"\npos = email.index("@")`,
        errorLabel: 'ValueError',
        explanation: 'When "@" is missing, .index("@") crashes with ValueError. Use .find("@") or check "@" in email first.',
        fixedCode: `email = "ada_school.ng"\npos = email.find("@")\nprint("@ position:", pos)`,
      },
    ],
    conceptsCounted: ['str-search', 'str-replace', 'str-padding'],
  },
  {
    id: 'd2-4-split-join-immutability',
    moduleId: 'module-d2',
    number: 'D2.4',
    title: 'Splitting, Joining & CSV Lines',
    subtitle: '.split(), .splitlines(), sep.join(), .encode() & memory ids',
    scenarioTitle: 'Tuck Shop Inventory CSV Line',
    sceneType: 'str-split-join',
    starterCode: `csv_row = "Peak Milk,3,450"
fields = csv_row.split(",")
item, qty, unit_price = fields
print("Parsed fields:", fields)

# Join a list of strings back with a custom separator
tags = ["JSS2", "Science", "Club"]
slug = "-".join(tags)
print("Joined slug:", slug)

# Prove str immutability using id()
greeting = "hello"
old_id = id(greeting)
greeting = greeting.upper()
print("Same id after .upper()?", old_id == id(greeting))
print("UTF-8 bytes:", "₦500".encode("utf-8"))`,
    predict: {
      prompt: 'How do you correctly join ["A", "B", "C"] with commas in Python?',
      options: [
        '",".join(["A", "B", "C"])',
        '["A", "B", "C"].join(",")',
        'join(["A", "B", "C"], ",")',
        '"A,B,C".join()',
      ],
      correctIndex: 0,
      explanation:
        'In Python, .join() is a method on the SEPARATOR string, not on the list! Call separator.join(iterable_of_strings).',
    },
    realLifeUses: [
      {
        context: 'Spreadsheets & CSV Files',
        title: 'Breaking rows with .split(",") and .splitlines()',
        description: 'Turns a text line like "Milk,3,450" into clean columns you can unpack into variables.',
      },
      {
        context: 'URLs & File Paths',
        title: 'Building slugs with "-".join(words)',
        description: 'Fastest and cleanest way to combine a list of words into one formatted string.',
      },
      {
        context: 'Network & Storage',
        title: 'Converting text to bytes with .encode()',
        description: 'Encodes Unicode symbols like ₦ into UTF-8 bytes for saving or sending online.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-d2-str-5',
        title: 'Passing ints directly to "-".join([1, 2, 3])',
        badCode: `nums = [10, 20, 30]\nprint("-".join(nums))`,
        errorLabel: 'TypeError',
        explanation: '.join() expects every element to be a str! Convert numbers first with map(str, nums).',
        fixedCode: `nums = [10, 20, 30]\nprint("-".join(map(str, nums)))`,
      },
    ],
    conceptsCounted: ['str-split', 'str-join', 'str-encode'],
  },
];

export const STAGE4_METHODS: MethodExplorerEntry[] = [
  {
    id: 'str-strip',
    type: 'str',
    name: '.strip() / .lstrip() / .rstrip()',
    signature: 's.strip([chars]) -> str',
    returns: 'str',
    mutatesInPlace: false,
    summary: 'Removes whitespace (or specified characters) from both ends of a string.',
    sampleCode: (v) => `s = ${v}\nclean = s.strip()\nprint("Before:", repr(s))\nprint("After :", repr(clean))`,
    tip: 'Remember .strip() only removes characters from the outer ends, never spaces in the middle.',
  },
  {
    id: 'str-case',
    type: 'str',
    name: '.upper() / .lower() / .title() / .swapcase()',
    signature: 's.upper() -> str',
    returns: 'str',
    mutatesInPlace: false,
    summary: 'Returns a new string with transformed letter casing while leaving the original untouched.',
    sampleCode: (v) => `s = ${v}\nprint("upper:", s.upper())\nprint("lower:", s.lower())\nprint("title:", s.title())\nprint("swapcase:", s.swapcase())`,
    tip: 'Use .lower() when comparing user answers like "Abuja" vs "ABUJA".',
  },
  {
    id: 'str-split-join',
    type: 'str',
    name: '.split() & sep.join()',
    signature: 's.split(sep=None, maxsplit=-1) -> list',
    returns: 'list',
    mutatesInPlace: false,
    summary: 'Splits text into a list of pieces, and joins a list of strings back with any separator.',
    sampleCode: (v) => `s = ${v}\nparts = s.split()\nprint("split():", parts)\nprint("joined with -:", "-".join(parts))`,
    tip: 'Calling .split() with no arguments splits on any whitespace and drops extra blanks.',
  },
  {
    id: 'str-find-count',
    type: 'str',
    name: '.find() / .rfind() / .count()',
    signature: 's.find(sub[, start[, end]]) -> int',
    returns: 'int',
    mutatesInPlace: false,
    summary: 'Locates the index of a substring (returning -1 if absent) or counts non-overlapping occurrences.',
    sampleCode: (v) => `s = ${v}\nprint("Length:", len(s))\nprint("find('a'):", s.find("a"))\nprint("count('a'):", s.count("a"))`,
    tip: 'Unlike .index(), .find() never crashes with ValueError when a substring is not present.',
  },
  {
    id: 'str-replace-affix',
    type: 'str',
    name: '.replace() / .removeprefix() / .removesuffix()',
    signature: 's.replace(old, new[, count]) -> str',
    returns: 'str',
    mutatesInPlace: false,
    summary: 'Replaces matching substrings or strips an exact leading prefix / trailing suffix.',
    sampleCode: (v) => `s = ${v}\nprint("replace spaces:", s.strip().replace(" ", "_"))\nprint("removeprefix('NG-'):", s.removeprefix("NG-"))`,
    tip: 'removeprefix() only removes the exact prefix at position 0, unlike lstrip() which removes individual characters.',
  },
  {
    id: 'str-checks',
    type: 'str',
    name: '.isdigit() / .isalpha() / .isalnum() / .startswith()',
    signature: 's.isdigit() -> bool',
    returns: 'bool',
    mutatesInPlace: false,
    summary: 'Tests character categories or prefixes/suffixes and returns True or False.',
    sampleCode: (v) => `s = ${v}.strip()\nprint("isdigit:", s.isdigit(), "| isalpha:", s.isalpha(), "| isalnum:", s.isalnum())\nprint("isupper:", s.isupper(), "| islower:", s.islower())`,
    tip: 'All .is*() checks return False for an empty string "".',
  },
  {
    id: 'str-align-encode',
    type: 'str',
    name: '.center() / .zfill() / .encode()',
    signature: 's.center(width, fillchar=" ") -> str',
    returns: 'str',
    mutatesInPlace: false,
    summary: 'Pads text cleanly to a fixed width or encodes characters into UTF-8 bytes.',
    sampleCode: (v) => `s = ${v}.strip()\nprint("center(18, '*'):", s.center(18, "*"))\nprint("zfill(12):", s.zfill(12))\nprint("encode():", s.encode("utf-8"))`,
    tip: '.zfill() keeps a leading minus sign "-" at the very front before inserting zeros.',
  },
];
