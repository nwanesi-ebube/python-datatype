import { LessonDefinition, MethodExplorerEntry } from '../types/lab';

export const MODULE_D3_LESSONS: LessonDefinition[] = [
  {
    id: 'd3-1-lists-mutability',
    moduleId: 'module-d3',
    number: 'D3.1',
    title: 'Lists (list): Indexing, Slicing & Mutability',
    subtitle: 'Ordered, mutable collections, in-place edits, slicing & comprehensions',
    scenarioTitle: 'Oshodi Danfo Bus Boarding Queue',
    sceneType: 'list-queue',
    starterCode: `# Lists are ordered and MUTABLE — you can change items inside memory!
queue = ["Chidi", "Amaka", "Tunde", "Bola"]
before_id = id(queue)

print("First passenger:", queue[0], "| Last:", queue[-1])

# Replace an item in place — watch the object id stay the SAME!
queue[1] = "Ngozi"
print("Updated queue:", queue)
print("Same id after edit?", before_id == id(queue))

# Slicing creates a NEW shallow copy list
front_two = queue[:2]
backup = queue[:]

# List comprehension transforms each item cleanly
upper_tags = [name.upper() for name in queue]
print("Front two:", front_two)
print("Upper tags:", upper_tags)`,
    predict: {
      prompt: 'If a = [10, 20]; b = a; b[0] = 99, what is print(a)?',
      options: [
        '[99, 20] — both a and b point to the exact same list object',
        '[10, 20] — b got a separate copy automatically',
        '[99, 10, 20]',
        'TypeError',
      ],
      correctIndex: 0,
      explanation:
        'Assigning b = a only attaches a second name tag to the same mutable list! Use b = a.copy() or b = a[:] when you want an independent list.',
    },
    realLifeUses: [
      {
        context: 'Transport & Queues',
        title: 'Dynamic passenger or order queues',
        description: 'Lists hold ordered items that grow, shrink, and reorder as passengers board or leave.',
      },
      {
        context: 'Class Test Scores',
        title: 'Transforming marks with [score + 5 for score in marks]',
        description: 'List comprehensions build a new list cleanly in one readable line.',
      },
      {
        context: 'Safe Backups',
        title: 'Slicing [:] before editing',
        description: 'Slicing a list returns a fresh list object so edits do not disturb the original.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-d3-list-1',
        title: 'Accidental aliasing with b = a instead of .copy()',
        badCode: `prices = [200, 350]\ndiscount_prices = prices\ndiscount_prices[0] = 150\nprint("Original prices:", prices)`,
        errorLabel: 'Logic Bug',
        explanation: 'prices and discount_prices shared one list in memory! Editing one changed both. Use .copy() or [:] to make an independent list.',
        fixedCode: `prices = [200, 350]\ndiscount_prices = prices.copy()\ndiscount_prices[0] = 150\nprint("Original:", prices, "| Discount:", discount_prices)`,
      },
      {
        id: 'm-d3-list-2',
        title: 'IndexError when accessing past the end of a list',
        badCode: `buses = ["Oshodi", "Yaba"]\nprint(buses[2])`,
        errorLabel: 'IndexError',
        explanation: 'A 2-item list only has indices 0 and 1 (or -2 and -1). Index 2 is outside the list.',
        fixedCode: `buses = ["Oshodi", "Yaba"]\nprint("Last bus:", buses[-1])`,
      },
    ],
    conceptsCounted: ['list-indexing', 'list-mutability', 'list-aliasing'],
  },
  {
    id: 'd3-2-list-methods-copy',
    moduleId: 'module-d3',
    number: 'D3.2',
    title: 'List Methods, Sorting & Copying',
    subtitle: '.append(), .insert(), .extend(), .pop(), .remove(), .sort() vs sorted()',
    scenarioTitle: 'Mile 12 Market Shopping Basket',
    sceneType: 'list-methods',
    starterCode: `basket = ["Tomatoes", "Onions"]

basket.append("Plantain")        # Adds 1 item at the end
basket.insert(0, "Rice")         # Inserts at index 0
basket.extend(["Oil", "Pepper"]) # Appends all items from another iterable
print("Full basket:", basket)

# Removing items
last_item = basket.pop()         # Removes & returns last item
basket.remove("Onions")          # Removes first matching value
print("Popped:", last_item, "| After remove:", basket)

# Sorting in place vs sorted() copy
prices = [1500, 450, 900, 1200]
ordered_copy = sorted(prices)
prices.sort(reverse=True)
print("Sorted copy:", ordered_copy)
print("Prices high->low:", prices)`,
    predict: {
      prompt: 'What does res = [3, 1, 2].sort() store inside res?',
      options: [
        'None — .sort() changes the list in place and returns None',
        '[1, 2, 3]',
        '[3, 2, 1]',
        'TypeError',
      ],
      correctIndex: 0,
      explanation:
        'Mutating methods like .sort(), .append(), and .reverse() change the list in place and return None. Use sorted(my_list) if you want a new sorted list returned!',
    },
    realLifeUses: [
      {
        context: 'Online Checkout',
        title: 'Adding and removing basket items',
        description: '.append(), .remove(), and .pop() mirror adding products to a cart and checking out items.',
      },
      {
        context: 'WAEC & JAMB Rankings',
        title: 'Sorting scores highest to lowest',
        description: '.sort(reverse=True) or sorted(scores, reverse=True) ranks student scores cleanly.',
      },
      {
        context: 'Undo Stacks',
        title: 'Last-in, first-out with .append() and .pop()',
        description: 'Using .append() to push and .pop() to undo the newest action is a classic stack pattern.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-d3-list-3',
        title: 'Assigning the return value of .append() or .sort()',
        badCode: `items = ["Garri", "Sugar"]\nitems = items.append("Milk")\nprint(items)`,
        errorLabel: 'Logic Bug',
        explanation: '.append() returns None! Writing items = items.append(...) erases your list and replaces it with None.',
        fixedCode: `items = ["Garri", "Sugar"]\nitems.append("Milk")\nprint(items)`,
      },
      {
        id: 'm-d3-list-4',
        title: 'Calling .remove() for an item not in the list',
        badCode: `cart = ["Yam", "Palm Oil"]\ncart.remove("Salt")`,
        errorLabel: 'ValueError',
        explanation: '.remove(x) raises ValueError when x is absent. Always check "Salt" in cart before calling .remove("Salt").',
        fixedCode: `cart = ["Yam", "Palm Oil"]\nif "Salt" in cart:\n    cart.remove("Salt")\nprint(cart)`,
      },
    ],
    conceptsCounted: ['list-methods', 'list-sort', 'list-pop'],
  },
  {
    id: 'd3-3-tuples-unpacking',
    moduleId: 'module-d3',
    number: 'D3.3',
    title: 'Tuples (tuple): Fixed Records & Unpacking',
    subtitle: 'Immutable ordered sequences, single-item (x,), *rest unpacking & methods',
    scenarioTitle: 'Abuja Landmark GPS & Exam Record',
    sceneType: 'tuple-coords',
    starterCode: `# Tuples are ordered and IMMUTABLE — ideal for fixed records!
aso_rock_gps = (9.0833, 7.5361)
lat, lon = aso_rock_gps
print(f"Latitude: {lat}, Longitude: {lon}")

# Single-item tuple MUST have a trailing comma!
not_a_tuple = ("WAEC")
real_tuple = ("WAEC",)
print("Types:", type(not_a_tuple), "vs", type(real_tuple))

# Star unpacking & tuple methods (.count and .index only)
grades = ("A1", "B2", "A1", "C4", "A1")
top, *middle, final = grades
print("Top:", top, "| Middle list:", middle, "| Final:", final)
print("Count of A1:", grades.count("A1"), "| First B2 index:", grades.index("B2"))`,
    predict: {
      prompt: 'What is the Python type of x = (42)?',
      options: [
        'int — parentheses alone just group math; you need a comma (42,) for a tuple',
        'tuple',
        'list',
        'SyntaxError',
      ],
      correctIndex: 0,
      explanation:
        'In Python, the comma makes a tuple, not the parentheses! (42) is just the integer 42, whereas (42,) or 42, is a 1-element tuple.',
    },
    realLifeUses: [
      {
        context: 'Maps & GPS Coordinates',
        title: 'Locking (latitude, longitude) pairs',
        description: 'A city’s coordinates should not accidentally be altered, so a tuple signals fixed structure.',
      },
      {
        context: 'Function Return Values',
        title: 'Returning multiple results like divmod(17, 5)',
        description: 'Python functions return multiple values packed into a tuple so callers can unpack them cleanly.',
      },
      {
        context: 'RGB Colours & Dictionary Keys',
        title: 'Using hashable tuples as dict keys',
        description: 'Unlike lists, tuples of immutable items can serve as keys in dictionaries or items in sets.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-d3-tuple-1',
        title: 'Trying to edit a tuple element in place',
        badCode: `point = (10, 20)\npoint[0] = 99`,
        errorLabel: 'TypeError',
        explanation: 'Tuples are IMMUTABLE! To change an item, create a new tuple or convert to a list temporarily.',
        fixedCode: `point = (10, 20)\npoint = (99, point[1])\nprint(point)`,
      },
      {
        id: 'm-d3-tuple-2',
        title: 'Forgetting the comma in a 1-item tuple',
        badCode: `single = ("Kano")\nprint(type(single), len(single))`,
        errorLabel: 'Logic Bug',
        explanation: 'Without a trailing comma, ("Kano") is just a plain str of length 4! Write ("Kano",) to get a 1-item tuple.',
        fixedCode: `single = ("Kano",)\nprint(type(single), len(single))`,
      },
    ],
    conceptsCounted: ['tuple-immutability', 'tuple-unpacking', 'single-tuple'],
  },
  {
    id: 'd3-4-range-enumerate-zip',
    moduleId: 'module-d3',
    number: 'D3.4',
    title: 'Ranges (range), Lazy Memory, enumerate & zip',
    subtitle: 'range(start, stop, step), O(1) memory, indexing, enumerate() & zip()',
    scenarioTitle: 'JSS3 Exam Seat Number Generator',
    sceneType: 'range-numberline',
    starterCode: `# range(start, stop, step) generates numbers lazily on demand!
seats = range(1, 11)
evens = range(0, 12, 2)
countdown = range(5, 0, -1)

print("evens properties:", evens.start, evens.stop, evens.step)
print("List of evens:", list(evens))
print("Countdown:", list(countdown))
print("evens[2]:", evens[2], "| 8 in evens?", 8 in evens)

# Huge ranges still store ONLY 3 integers in memory!
million = range(0, 1_000_000)
print("Million len:", len(million), "| Last:", million[-1])

# Combining sequences with enumerate() and zip()
students = ["Ada", "Bola", "Chidi"]
scores = [88, 94, 79]
for pos, (name, score) in enumerate(zip(students, scores), start=1):
    print(f"Seat {pos}: {name} -> {score}%")`,
    predict: {
      prompt: 'What does list(range(2, 10, 3)) produce?',
      options: ['[2, 5, 8]', '[2, 5, 8, 11]', '[3, 6, 9]', '[2, 3, 4, 5, 6, 7, 8, 9]'],
      correctIndex: 0,
      explanation:
        'It starts at 2, adds step 3 each time (2 -> 5 -> 8), and stops BEFORE 10 (11 is >= 10, so it is excluded).',
    },
    realLifeUses: [
      {
        context: 'School Timetables & Countdowns',
        title: 'Counting up or backwards cleanly',
        description: 'Negative steps like range(10, 0, -1) power timers, rocket countdowns, and reverse loops.',
      },
      {
        context: 'Memory Efficiency',
        title: 'Looping 1,000,000 times without wasting RAM',
        description: 'range(1_000_000) only remembers start, stop, and step — it does not build a million-item list unless you call list().',
      },
      {
        context: 'Paired Reports',
        title: 'Pairing names & marks with enumerate() and zip()',
        description: 'enumerate() adds seat/row numbers and zip() pairs matching columns side by side.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-d3-range-1',
        title: 'Counting backwards with default positive step (+1)',
        badCode: `nums = list(range(5, 1))\nprint("Backward?:", nums)`,
        errorLabel: 'Logic Bug',
        explanation: 'range(5, 1) uses default step=+1, so starting at 5 already passed 1 and produces []! Pass step=-1.',
        fixedCode: `nums = list(range(5, 0, -1))\nprint("Backward:", nums)`,
      },
      {
        id: 'm-d3-range-2',
        title: 'Passing a float to range()',
        badCode: `steps = range(0, 5, 0.5)`,
        errorLabel: 'TypeError',
        explanation: 'range() only accepts whole ints for start, stop, and step — never floats.',
        fixedCode: `steps = [i * 0.5 for i in range(0, 10)]\nprint(steps)`,
      },
    ],
    conceptsCounted: ['range-lazy', 'range-step', 'enumerate-zip'],
  },
];

export const STAGE5_METHODS: MethodExplorerEntry[] = [
  {
    id: 'list-append-extend',
    type: 'list',
    name: '.append() / .extend()',
    signature: 'lst.append(x) -> None',
    returns: 'NoneType',
    mutatesInPlace: true,
    summary: 'Adds one item with .append(x) or unpacks all items from another sequence with .extend(iterable) in place.',
    sampleCode: (v) =>
      `items = ${v}\nitems.append(99)\nprint("After append:", items)\nitems.extend(["extra"])\nprint("After extend:", items)`,
    tip: '.append([1, 2]) adds ONE nested list item; .extend([1, 2]) adds two separate items.',
  },
  {
    id: 'list-insert-pop',
    type: 'list',
    name: '.insert() / .pop()',
    signature: 'lst.pop([index]) -> item',
    returns: 'NoneType',
    mutatesInPlace: true,
    summary: 'Inserts an item at a given index or pops (removes and returns) an item from the end or any index.',
    sampleCode: (v) =>
      `items = ${v}\nitems.insert(0, "FIRST")\nprint("After insert:", items)\nremoved = items.pop()\nprint("Popped:", removed, "| Left:", items)`,
    tip: '.pop() removes the last item by default; .pop(0) removes the very first item.',
  },
  {
    id: 'list-remove-clear',
    type: 'list',
    name: '.remove() / .clear()',
    signature: 'lst.remove(x) -> None',
    returns: 'NoneType',
    mutatesInPlace: true,
    summary: 'Removes the first element equal to x (raising ValueError if missing) or empties the whole list with .clear().',
    sampleCode: (v) =>
      `items = ${v}\ntarget = items[0] if len(items) > 0 else None\nif target in items:\n    items.remove(target)\nprint("After remove:", items)`,
    tip: 'Use "x in lst" before calling lst.remove(x) so missing values never crash with ValueError.',
  },
  {
    id: 'list-sort-reverse',
    type: 'list',
    name: '.sort() / .reverse() / sorted()',
    signature: 'lst.sort(reverse=False) -> None',
    returns: 'NoneType',
    mutatesInPlace: true,
    summary: 'Sorts or reverses the list right inside memory (returning None), while sorted(lst) builds a fresh sorted copy.',
    sampleCode: (v) =>
      `items = ${v}\ncopy_sorted = sorted(items)\nitems.reverse()\nprint("sorted() copy:", copy_sorted)\nprint("reversed in place:", items)`,
    tip: 'Never write x = x.sort() — .sort() mutates x in place and returns None!',
  },
  {
    id: 'list-copy-search',
    type: 'list',
    name: '.copy() / .count() / .index()',
    signature: 'lst.copy() -> list',
    returns: 'list',
    mutatesInPlace: false,
    summary: 'Creates a shallow independent copy of a list, counts matches, or finds the index of an element.',
    sampleCode: (v) =>
      `items = ${v}\nclone = items.copy()\nprint("Same id as original?", id(items) == id(clone))\nprint("len:", len(items), "| first item count:", items.count(items[0]))`,
    tip: 'items.copy() creates a new list object ID so changes to clone do not mutate items.',
  },
  {
    id: 'tuple-count-index',
    type: 'tuple',
    name: '.count() / .index()',
    signature: 't.index(x[, start[, end]]) -> int',
    returns: 'int',
    mutatesInPlace: false,
    summary: 'Tuples are immutable, so their only two methods are .count(x) and .index(x) for reading.',
    sampleCode: (v) =>
      `t = ${v}\nfirst = t[0]\nprint("Length:", len(t))\nprint("count(t[0]):", t.count(first))\nprint("index(t[0]):", t.index(first))`,
    tip: 'Because tuples have no .append() or .remove(), Python keeps fixed records safe from accidental edits.',
  },
  {
    id: 'tuple-unpack-convert',
    type: 'tuple',
    name: 'Unpacking & list(t) Conversion',
    signature: 'tuple(iterable) -> tuple',
    returns: 'list',
    mutatesInPlace: false,
    summary: 'Unpacks tuple elements into variables with *rest or converts between immutable tuple and mutable list.',
    sampleCode: (v) =>
      `t = ${v}\nhead, *rest = t\nprint("head:", head, "| *rest:", rest)\nas_list = list(t)\nprint("Mutable list copy:", as_list)`,
    tip: 'Starred unpacking (*rest) always produces a list, even when unpacking a tuple!',
  },
  {
    id: 'range-inspect',
    type: 'range',
    name: '.start / .stop / .step & list()',
    signature: 'range(start, stop[, step]) -> range',
    returns: 'list',
    mutatesInPlace: false,
    summary: 'Inspects the three integers stored by a lazy range object and expands its values with list().',
    sampleCode: (v) =>
      `r = ${v}\nprint("start:", r.start, "| stop:", r.stop, "| step:", r.step)\nprint("len:", len(r), "| values:", list(r))`,
    tip: 'Even range(0, 1_000_000) stores only 3 ints (start, stop, step) until you iterate or call list().',
  },
  {
    id: 'range-search-index',
    type: 'range',
    name: '.count() / .index() / Membership',
    signature: 'r.index(value) -> int',
    returns: 'int',
    mutatesInPlace: false,
    summary: 'Checks membership with "in", slices into a sub-range, or looks up an element position instantly.',
    sampleCode: (v) =>
      `r = ${v}\nfirst = r[0]\nprint("First:", first, "| Last:", r[-1])\nprint("count(first):", r.count(first), "| index(first):", r.index(first))`,
    tip: 'Slicing a range returns another lazy range object, not a list!',
  },
];
