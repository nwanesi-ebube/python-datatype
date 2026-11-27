import { LessonDefinition, MethodExplorerEntry } from '../types/lab';

export const MODULE_D4_LESSONS: LessonDefinition[] = [
  {
    id: 'd4-1-dict-records',
    moduleId: 'module-d4',
    number: 'D4.1',
    title: 'Dictionaries (dict): Key-Value Lookup & Methods',
    subtitle: 'Mutable key->value maps, .get(), .items(), .setdefault(), .update() & |',
    scenarioTitle: 'Student Record & Market Price Book',
    sceneType: 'dict-records',
    starterCode: `# Dictionaries map unique, hashable keys to values!
student = {"name": "Amaka", "class": "SS2", "score": 88}

# Add or update a key in place (same object id!)
student["club"] = "Robotics"
student.update({"score": 92})

# Safe lookup with .get() avoids KeyError crashes
phone = student.get("phone", "Not provided")
house = student.setdefault("house", "Blue")
print("Phone:", phone, "| House:", house)

# Loop cleanly over keys and values with .items()
for key, val in student.items():
    print(f"{key}: {val}")

# Python 3.9+ union (|) creates a merged copy
extras = {"prefect": True, "score": 95}
full_profile = student | extras
print("Merged score:", full_profile["score"])`,
    predict: {
      prompt: 'If prices = {"rice": 900, "beans": 750}, what does prices.get("yam", 0) return?',
      options: [
        '0 — .get() returns the fallback default without modifying prices',
        'KeyError',
        'None',
        'Adds "yam": 0 into prices and returns None',
      ],
      correctIndex: 0,
      explanation:
        '.get(key, default) safely looks up a key and returns default if absent without crashing or editing the dictionary (unlike .setdefault()).',
    },
    realLifeUses: [
      {
        context: 'School & Bank Databases',
        title: 'Instant lookup by ID or matric number',
        description: 'Finding a student record by admission ID happens in near-instant O(1) time regardless of class size.',
      },
      {
        context: 'Shop Price Lists & JSON APIs',
        title: 'Storing named fields cleanly',
        description: 'Dictionaries mirror JSON records returned by payment gateways, weather services, and web apps.',
      },
      {
        context: 'Word & Vote Counters',
        title: 'Counting occurrences with counts.get(item, 0) + 1',
        description: 'Tallies items cleanly without pre-populating every possible key beforehand.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-d4-dict-1',
        title: 'Using [] on a missing key instead of .get()',
        badCode: `prices = {"garri": 400, "sugar": 250}\nprint(prices["milk"])`,
        errorLabel: 'KeyError',
        explanation: 'Square-bracket lookup raises KeyError when the key is missing. Use prices.get("milk", 0) or check "milk" in prices.',
        fixedCode: `prices = {"garri": 400, "sugar": 250}\nprint("Milk price:", prices.get("milk", "Out of stock"))`,
      },
      {
        id: 'm-d4-dict-2',
        title: 'Using a mutable list as a dictionary key',
        badCode: `grid = {[1, 2]: "Treasure"}`,
        errorLabel: 'TypeError',
        explanation: 'Dictionary keys must be immutable/hashable (str, int, tuple). Lists can change, so Python raises unhashable TypeError.',
        fixedCode: `grid = {(1, 2): "Treasure"}\nprint(grid[(1, 2)])`,
      },
    ],
    conceptsCounted: ['dict-lookup', 'dict-methods', 'dict-hashable'],
  },
  {
    id: 'd4-2-set-venn',
    moduleId: 'module-d4',
    number: 'D4.2',
    title: 'Sets (set): Unique Items & Venn Algebra',
    subtitle: 'Automatic deduplication, union (|), intersection (&), difference (-) & ^',
    scenarioTitle: 'School Clubs Venn Diagram',
    sceneType: 'set-venn',
    starterCode: `# Sets automatically remove duplicates and are unordered!
coding = {"Ada", "Bola", "Chidi", "Ada"}
robotics = {"Chidi", "Tunde", "Kemi"}
print("Unique coding club:", coding)

# Mutate a set in place with .add() and .discard()
coding.add("Zainab")
coding.discard("GhostName") # Safe even if missing!

# Set algebra (Venn diagram operations)
both_clubs = coding & robotics         # Intersection
all_members = coding | robotics        # Union
only_coding = coding - robotics        # Difference
one_club_only = coding ^ robotics      # Symmetric difference

print("In BOTH clubs (&):", both_clubs)
print("ALL members (|):", all_members)
print("ONLY coding (-):", only_coding)
print("In exactly ONE (^):", one_club_only)`,
    predict: {
      prompt: 'In Python, what is the type of empty = {} ?',
      options: [
        'dict — you MUST write set() to create an empty set',
        'set',
        'frozenset',
        'tuple',
      ],
      correctIndex: 0,
      explanation:
        'Curly braces {} alone create an empty dictionary! Always call set() when you want an empty set.',
    },
    realLifeUses: [
      {
        context: 'Attendance & Deduplication',
        title: 'Removing duplicate names or phone numbers',
        description: 'Passing any list to set(names) drops repeated entries instantly.',
      },
      {
        context: 'Timetables & Subject Clashes',
        title: 'Finding common students with & (intersection)',
        description: 'Checking coding & robotics immediately reveals who belongs to both groups.',
      },
      {
        context: 'Fast Membership Checks',
        title: 'Checking "user" in banned_users in O(1)',
        description: 'Set membership testing with "in" is far faster than scanning a long list.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-d4-set-1',
        title: 'Using {} expecting an empty set',
        badCode: `tags = {}\ntags.add("python")`,
        errorLabel: 'AttributeError',
        explanation: '{} creates an empty dict, which has no .add() method! Use tags = set() for an empty set.',
        fixedCode: `tags = set()\ntags.add("python")\nprint(tags)`,
      },
      {
        id: 'm-d4-set-2',
        title: 'Calling .remove() when the item might be absent',
        badCode: `club = {"Ada", "Bola"}\nclub.remove("Musa")`,
        errorLabel: 'KeyError',
        explanation: '.remove() raises KeyError if the element is missing. Use .discard("Musa") when absence is okay.',
        fixedCode: `club = {"Ada", "Bola"}\nclub.discard("Musa")\nprint(club)`,
      },
    ],
    conceptsCounted: ['set-unique', 'set-venn', 'empty-set'],
  },
  {
    id: 'd4-3-frozenset-immutability',
    moduleId: 'module-d4',
    number: 'D4.3',
    title: 'Frozen Sets (frozenset): Locked Sets & Hashing',
    subtitle: 'Immutable sets, .issubset() / .issuperset(), dict keys & nested sets',
    scenarioTitle: 'Locked Exam Role Permissions',
    sceneType: 'frozenset-lock',
    starterCode: `# frozenset is an IMMUTABLE version of set — locked after creation!
staff_perms = frozenset(["read", "grade"])
admin_perms = frozenset(["read", "grade", "publish", "audit"])

print("Can staff publish?", "publish" in staff_perms)
print("Staff subset of admin?", staff_perms <= admin_perms)
print("Extra admin powers:", admin_perms - staff_perms)

# Because frozenset is immutable & hashable, it can be a dict key!
role_labels = {
    staff_perms: "Subject Teacher",
    admin_perms: "Exam Officer",
}
print("Role title:", role_labels[staff_perms])`,
    predict: {
      prompt: 'Why can a frozenset be used as a dictionary key while a normal set cannot?',
      options: [
        'frozenset is immutable so its hash value never changes',
        'frozenset is always smaller than a set',
        'frozenset allows duplicate values',
        'frozenset converts items into strings',
      ],
      correctIndex: 0,
      explanation:
        'Dictionary keys must be hashable (unchanging). Normal sets are mutable, so Python forbids hashing them; frozenset locks the contents so it can safely act as a key or sit inside another set.',
    },
    realLifeUses: [
      {
        context: 'Security & Access Control',
        title: 'Locking user role permissions',
        description: 'Storing permission flags in a frozenset guarantees no code path can accidentally .add("admin").',
      },
      {
        context: 'Graphs & Routes',
        title: 'Undirected edges as {frozenset({"Lagos", "Ibadan"})}',
        description: 'Pairs of connected cities can live inside a set or dict key cleanly without caring about order.',
      },
      {
        context: 'Caching Results',
        title: 'Using unordered option sets as memo keys',
        description: 'Order-independent combinations like frozenset(selected_toppings) work directly as cache keys.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-d4-fset-1',
        title: 'Trying to call .add() on a frozenset',
        badCode: `roles = frozenset(["student", "library"])\nroles.add("admin")`,
        errorLabel: 'AttributeError',
        explanation: 'frozenset is immutable — it has no .add(), .remove(), or .clear() methods! Build a new frozenset with | instead.',
        fixedCode: `roles = frozenset(["student", "library"])\nupdated = roles | frozenset(["lab"])\nprint(updated)`,
      },
      {
        id: 'm-d4-fset-2',
        title: 'Putting a mutable set inside another set or dict key',
        badCode: `groups = { {"A", "B"}, {"C"} }`,
        errorLabel: 'TypeError',
        explanation: 'Set elements must be hashable! Wrap inner sets in frozenset() before nesting.',
        fixedCode: `groups = {frozenset(["A", "B"]), frozenset(["C"])}\nprint(len(groups))`,
      },
    ],
    conceptsCounted: ['frozenset-immutable', 'frozenset-hashable'],
  },
  {
    id: 'd4-4-bytes-bytearray',
    moduleId: 'module-d4',
    number: 'D4.4',
    title: 'Bytes (bytes) & Bytearray (bytearray)',
    subtitle: 'Raw 0..255 byte sequences, UTF-8 .encode()/.decode(), .hex() & mutable buffers',
    scenarioTitle: 'SMS Network Packet & Mutable Buffer',
    sceneType: 'bytes-packets',
    starterCode: `# str holds human characters; bytes holds raw integers 0..255!
message = "₦500"
packet = message.encode("utf-8")
print("Encoded bytes:", packet)
print("Hex view:", packet.hex(), "| Byte count:", len(packet))

# Indexing bytes returns an int (0..255); slicing returns bytes!
print("First byte int:", packet[0], "| Slice:", packet[:3])
print("Decoded back:", packet.decode("utf-8"))

# bytearray is the MUTABLE cousin of bytes
buf = bytearray(b"NG-01")
buf[3] = 57          # ASCII 57 is '9'
buf.append(33)       # ASCII 33 is '!'
print("Edited buffer:", buf, "->", buf.decode("utf-8"))`,
    predict: {
      prompt: 'What does b"ABC"[0] return in Python?',
      options: [
        '65 (an int) — bytes indexing yields a byte number 0..255, not a 1-char string',
        'b"A"',
        '"A"',
        'TypeError',
      ],
      correctIndex: 0,
      explanation:
        'A bytes object is a sequence of 8-bit integers (0–255). Indexing packet[0] gives an int (ASCII 65 for "A"), while slicing packet[0:1] gives bytes b"A".',
    },
    realLifeUses: [
      {
        context: 'Internet & SMS Gateways',
        title: 'Sending UTF-8 text over sockets and HTTP',
        description: 'Networks only transmit bytes (0–255), so Python encodes strings like "₦500" with .encode("utf-8") first.',
      },
      {
        context: 'Files, Images & PDFs',
        title: 'Reading binary headers cleanly',
        description: 'Image formats like PNG start with fixed magic bytes that Python inspects as raw bytes.',
      },
      {
        context: 'Streaming & Cryptography',
        title: 'Updating data in place with bytearray',
        description: 'When modifying chunks of binary data without copying gigabytes, bytearray lets you edit bytes directly.',
      },
    ],
    commonMistakes: [
      {
        id: 'm-d4-bytes-1',
        title: 'Trying to edit an immutable bytes object in place',
        badCode: `header = b"PNG"\nheader[0] = 66`,
        errorLabel: 'TypeError',
        explanation: 'bytes is immutable just like str! Convert to bytearray(header) when you need to modify individual bytes.',
        fixedCode: `header = bytearray(b"PNG")\nheader[0] = 66\nprint(header)`,
      },
      {
        id: 'm-d4-bytes-2',
        title: 'Passing an integer outside 0..255 into bytes()',
        badCode: `raw = bytes([65, 300])`,
        errorLabel: 'ValueError',
        explanation: 'One byte has 8 bits, so it can only hold numbers from 0 to 255 inclusive.',
        fixedCode: `raw = bytes([65, 66, 67])\nprint(raw.decode("utf-8"))`,
      },
    ],
    conceptsCounted: ['bytes-utf8', 'bytearray-mutable', 'hex-encoding'],
  },
];

export const STAGE6_METHODS: MethodExplorerEntry[] = [
  {
    id: 'dict-get-setdefault',
    type: 'dict',
    name: '.get() / .setdefault()',
    signature: 'd.get(key, default=None) -> value',
    returns: 'NoneType',
    mutatesInPlace: false,
    summary: 'Safely reads a key with a fallback default (.get) or inserts a default only if the key is missing (.setdefault).',
    sampleCode: (v) =>
      `d = ${v}\nprint("Safe get('missing'):", d.get("missing", "N/A"))\nres = d.setdefault("verified", True)\nprint("After setdefault:", d, "| returned:", res)`,
    tip: '.get() never mutates the dictionary, whereas .setdefault() saves the fallback into the dictionary if missing.',
  },
  {
    id: 'dict-views',
    type: 'dict',
    name: '.keys() / .values() / .items()',
    signature: 'd.items() -> [(key, value), ...]',
    returns: 'list',
    mutatesInPlace: false,
    summary: 'Returns the dictionary keys, values, or (key, value) pairs for looping and inspection.',
    sampleCode: (v) =>
      `d = ${v}\nprint("keys:", d.keys())\nprint("values:", d.values())\nprint("items:", d.items())`,
    tip: 'Use "for k, v in d.items():" to unpack every key and value together cleanly.',
  },
  {
    id: 'dict-update-union',
    type: 'dict',
    name: '.update() & Union (|)',
    signature: 'd.update(other) -> None',
    returns: 'NoneType',
    mutatesInPlace: true,
    summary: 'Merges another mapping into the dictionary in place with .update(), or builds a new merged dictionary with |.',
    sampleCode: (v) =>
      `d = ${v}\nmerged = d | {"status": "active"}\nprint("New union copy:", merged)\nd.update({"updated": True})\nprint("Original updated:", d)`,
    tip: 'Use d1 | d2 when you want to keep d1 untouched; use d1.update(d2) to mutate d1 in place.',
  },
  {
    id: 'dict-pop-copy',
    type: 'dict',
    name: '.pop() / .popitem() / .copy()',
    signature: 'd.pop(key[, default]) -> value',
    returns: 'dict',
    mutatesInPlace: true,
    summary: 'Removes a specific key (.pop), removes the last inserted pair (.popitem), or makes an independent shallow copy.',
    sampleCode: (v) =>
      `d = ${v}\nbackup = d.copy()\nremoved = d.pop("missing", "skipped")\nprint("pop('missing'):", removed)\nprint("backup same id?", id(d) == id(backup))`,
    tip: 'Passing a default argument to d.pop(key, None) prevents KeyError if the key is absent.',
  },
  {
    id: 'set-mutate',
    type: 'set',
    name: '.add() / .discard() / .remove()',
    signature: 's.discard(x) -> None',
    returns: 'NoneType',
    mutatesInPlace: true,
    summary: 'Adds unique items or removes items safely (.discard ignores missing items; .remove raises KeyError).',
    sampleCode: (v) =>
      `s = ${v}\ns.add("NewMember")\ns.discard("AbsentItem")\nprint("Updated set:", s, "| len:", len(s))`,
    tip: 'Prefer .discard(x) over .remove(x) unless a missing item really is an error.',
  },
  {
    id: 'set-algebra',
    type: 'set',
    name: '.union() / .intersection() / .difference()',
    signature: 's.intersection(other) -> set',
    returns: 'set',
    mutatesInPlace: false,
    summary: 'Performs Venn diagram combinations (| union, & intersection, - difference, ^ symmetric difference).',
    sampleCode: (v) =>
      `a = ${v}\nb = {"Chidi", "Ada", 2, 3}\nprint("union:", a.union(b))\nprint("intersection:", a.intersection(b))\nprint("difference:", a.difference(b))`,
    tip: 'Named methods like .union(other) even accept a list or tuple, whereas | requires both sides to be sets.',
  },
  {
    id: 'set-relations',
    type: 'set',
    name: '.issubset() / .issuperset() / .isdisjoint()',
    signature: 's.issubset(other) -> bool',
    returns: 'bool',
    mutatesInPlace: false,
    summary: 'Tests whether every element is inside another set, contains another set, or shares zero items.',
    sampleCode: (v) =>
      `a = ${v}\nb = a | {"Extra"}\nprint("a <= b (subset):", a.issubset(b))\nprint("b >= a (superset):", b.issuperset(a))\nprint("disjoint with {'Z'}?", a.isdisjoint({"Z"}))`,
    tip: 's.isdisjoint(other) is True when the two sets have no elements in common.',
  },
  {
    id: 'frozenset-algebra',
    type: 'frozenset',
    name: '.union() / .intersection() / .difference()',
    signature: 'fs.union(other) -> frozenset',
    returns: 'frozenset',
    mutatesInPlace: false,
    summary: 'Builds new frozensets using set algebra without mutating the locked original.',
    sampleCode: (v) =>
      `fs = ${v}\nmore = fs | frozenset(["extra"])\nprint("Original:", fs)\nprint("New union:", more)\nprint("Shared:", fs & more)`,
    tip: 'Because frozenset is immutable, it has no .add(), .remove(), or .clear() methods.',
  },
  {
    id: 'frozenset-hashable',
    type: 'frozenset',
    name: 'Dict Keys & .issubset()',
    signature: 'fs.issubset(other) -> bool',
    returns: 'dict',
    mutatesInPlace: false,
    summary: 'Uses an immutable frozenset directly as a dictionary key or inside another set.',
    sampleCode: (v) =>
      `fs = ${v}\nlookup = {fs: "Approved Role"}\nprint("Dict lookup:", lookup[fs])\nprint("Subset of self?", fs.issubset(fs))`,
    tip: 'Use frozenset whenever you need a hashable set for dictionary keys or nested sets.',
  },
  {
    id: 'bytes-decode-hex',
    type: 'bytes',
    name: '.decode() / .hex() & Byte Indexing',
    signature: 'b.decode("utf-8") -> str',
    returns: 'str',
    mutatesInPlace: false,
    summary: 'Decodes raw bytes back into a str, inspects hexadecimal bytes with .hex(), and reads byte ints 0..255.',
    sampleCode: (v) =>
      `b = ${v}\nprint("len:", len(b), "| first byte int:", b[0])\nprint("hex:", b.hex())\nprint("decoded:", b.decode("utf-8"))`,
    tip: 'b[0] returns an int (0–255), while b[0:1] returns a 1-byte bytes slice.',
  },
  {
    id: 'bytes-text-ops',
    type: 'bytes',
    name: '.upper() / .split() / .replace()',
    signature: 'b.replace(old, new) -> bytes',
    returns: 'bytes',
    mutatesInPlace: false,
    summary: 'Transforms immutable bytes just like ASCII strings while always returning a new bytes object.',
    sampleCode: (v) =>
      `b = ${v}\nprint("upper:", b.upper())\nprint("split:", b.split())\nprint("startswith b'N'?", b.startswith(b"N"))`,
    tip: 'Arguments to bytes methods like .replace() and .startswith() must themselves be bytes literals (b"...").',
  },
  {
    id: 'bytearray-edit',
    type: 'bytearray',
    name: 'In-Place buf[i] = byte & .append()',
    signature: 'ba.append(byte_int) -> None',
    returns: 'NoneType',
    mutatesInPlace: true,
    summary: 'Mutates individual byte positions (0..255) or appends new byte ints right inside memory.',
    sampleCode: (v) =>
      `ba = ${v}\nbefore = id(ba)\nba[0] = 88\nba.append(33)\nprint("Edited:", ba, "| same id?", before == id(ba))`,
    tip: 'Every byte value assigned to a bytearray must be an integer between 0 and 255.',
  },
  {
    id: 'bytearray-decode',
    type: 'bytearray',
    name: '.extend() / .pop() / .decode()',
    signature: 'ba.decode("utf-8") -> str',
    returns: 'str',
    mutatesInPlace: true,
    summary: 'Extends or pops bytes from a mutable buffer, then decodes the buffer back to readable text.',
    sampleCode: (v) =>
      `ba = ${v}\nba.extend([45, 79, 75])\nlast = ba.pop()\nprint("popped byte int:", last)\nprint("decoded:", ba.decode("utf-8"))`,
    tip: '.pop() returns the removed byte as an integer (0–255) and shortens the bytearray in place.',
  },
];
