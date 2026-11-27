import { ModuleDefinition } from '../types/lab';
import { MODULE_A_LESSONS } from './moduleA';
import { MODULE_B_LESSONS } from './moduleB';
import { MODULE_C_LESSONS } from './moduleC';
import { MODULE_D1_LESSONS } from './moduleD1';
import { MODULE_D2_LESSONS } from './moduleD2';
import { MODULE_D3_LESSONS } from './moduleD3';
import { MODULE_D4_LESSONS } from './moduleD4';
import { MODULE_E_LESSONS } from './moduleE';

export const MODULES: ModuleDefinition[] = [
  {
    id: 'module-a',
    code: 'Module A',
    title: 'Variables & Memory Tags',
    description: 'How Python names work, naming rules, dynamic typing, unpacking and swaps.',
    stageReady: true,
    stageNumber: 1,
    lessons: MODULE_A_LESSONS,
  },
  {
    id: 'module-b',
    code: 'Module B',
    title: 'print() Pipeline',
    description: 'sep, end, f-strings, escape sequences and receipt formatting.',
    stageReady: true,
    stageNumber: 2,
    lessons: MODULE_B_LESSONS,
  },
  {
    id: 'module-c',
    code: 'Module C',
    title: 'input() & Type Conversion',
    description: 'Interactive prompts, string returns, int()/float() and validation.',
    stageReady: true,
    stageNumber: 2,
    lessons: MODULE_C_LESSONS,
  },
  {
    id: 'module-d1',
    code: 'Module D1',
    title: 'Numbers, Bool & NoneType',
    description: 'int, float, complex, bool truth tables and None.',
    stageReady: true,
    stageNumber: 3,
    lessons: MODULE_D1_LESSONS,
  },
  {
    id: 'module-d2',
    code: 'Module D2',
    title: 'Strings (str) & Methods',
    description: 'Indexing, slicing and every core string method.',
    stageReady: true,
    stageNumber: 4,
    lessons: MODULE_D2_LESSONS,
  },
  {
    id: 'module-d3',
    code: 'Module D3',
    title: 'Lists, Tuples & Ranges',
    description: 'Mutable queues, immutable coordinates and range sequences.',
    stageReady: true,
    stageNumber: 5,
    lessons: MODULE_D3_LESSONS,
  },
  {
    id: 'module-d4',
    code: 'Module D4',
    title: 'Dicts, Sets & Bytes',
    description: 'Student records, club Venn diagrams, frozenset and bytes.',
    stageReady: true,
    stageNumber: 6,
    lessons: MODULE_D4_LESSONS,
  },
  {
    id: 'module-e',
    code: 'Module E',
    title: 'Conversions, Ops & Mutability',
    description: 'Conversion matrix, operator lab, aliasing vs copying and choosing types.',
    stageReady: true,
    stageNumber: 7,
    lessons: MODULE_E_LESSONS,
  },
];
