export type ThemeId = 'light' | 'dark' | 'high-contrast' | 'ocean' | 'forest' | 'sunset';
export type TextSize = 'S' | 'M' | 'L' | 'XL';
export type LayoutDensity = 'compact' | 'comfortable';

export interface AppearanceSettings {
  theme: ThemeId;
  textSize: TextSize;
  density: LayoutDensity;
  speed: number; // 0.5 to 3
  reduceMotion: boolean;
  readAloud: boolean;
  teachingMode?: boolean;
}

export interface PanelLayoutState {
  leftOpen: boolean;
  rightOpen: boolean;
  bottomOpen: boolean;
  bottomHeight: number;
  focusMode: boolean;
}

export interface UserProgress {
  xp: number;
  streakDays: number;
  lastActiveDate: string;
  completedLessons: string[];
  exploredConcepts: string[];
  badges: string[];
  savedCode: Record<string, string>;
  gameHighScores: Record<string, number>;
  settings: AppearanceSettings;
  panelState: PanelLayoutState;
}

export type PyTypeName =
  | 'int'
  | 'float'
  | 'complex'
  | 'bool'
  | 'str'
  | 'list'
  | 'tuple'
  | 'range'
  | 'dict'
  | 'set'
  | 'frozenset'
  | 'NoneType'
  | 'bytes'
  | 'bytearray'
  | 'function'
  | 'module';

export interface PyObjectSnapshot {
  id: number;
  type: PyTypeName;
  repr: string;
  mutable: boolean;
  previewValue: unknown;
}

export interface TraceVariable {
  name: string;
  objectId: number;
  type: PyTypeName;
  repr: string;
  mutable: boolean;
  changed?: boolean;
  isNew?: boolean;
  aliasedWith?: string[];
}

export interface TraceStep {
  stepIndex: number;
  line: number;
  codeLine: string;
  narration: string;
  explainMore: string;
  variables: TraceVariable[];
  heap: Record<number, PyObjectSnapshot>;
  outputSoFar: string;
  outputDelta: string;
  stderrDelta?: string;
  eventKind: 'assign' | 'reassign' | 'alias' | 'unpack' | 'swap' | 'del' | 'print' | 'input' | 'expr' | 'control' | 'error';
  changedNames: string[];
  deletedNames?: string[];
  sceneHint?: Record<string, unknown>;
}

export interface FriendlyError {
  errorType: string;
  message: string;
  line: number;
  friendlyTitle: string;
  friendlyReason: string;
  hint: string;
}

export type EngineStepYield =
  | { kind: 'step'; trace: TraceStep }
  | { kind: 'input'; prompt: string; line: number; partialOutput: string }
  | { kind: 'done'; steps: TraceStep[]; finalOutput: string; finalStderr: string }
  | { kind: 'error'; error: FriendlyError; steps: TraceStep[]; finalOutput: string };

export interface CommonMistakeItem {
  id: string;
  title: string;
  badCode: string;
  errorLabel: string;
  explanation: string;
  fixedCode: string;
}

export interface RealLifeUse {
  context: string;
  title: string;
  description: string;
}

export interface PredictChallenge {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonDefinition {
  id: string;
  moduleId: string;
  number: string;
  title: string;
  subtitle: string;
  scenarioTitle: string;
  sceneType:
    | 'tuck-shop'
    | 'class-register'
    | 'naming-lab'
    | 'unpacking-cups'
    | 'savings-ledger'
    | 'print-pipeline'
    | 'receipt-printer'
    | 'report-card'
    | 'input-pipeline'
    | 'atm-pin'
    | 'registration-form'
    | 'int-bus-fare'
    | 'float-fuel-pump'
    | 'complex-vector'
    | 'bool-logic-gate'
    | 'none-locker'
    | 'str-index-tape'
    | 'str-cleaner'
    | 'str-search-replace'
    | 'str-split-join'
    | 'list-queue'
    | 'list-methods'
    | 'tuple-coords'
    | 'range-numberline'
    | 'dict-records'
    | 'set-venn'
    | 'frozenset-lock'
    | 'bytes-packets'
    | 'conversion-bridge'
    | 'operator-bench'
    | 'mutability-clone'
    | 'type-blueprint';
  starterCode: string;
  predict?: PredictChallenge;
  realLifeUses: RealLifeUse[];
  commonMistakes: CommonMistakeItem[];
  conceptsCounted: string[];
}

export interface MethodExplorerEntry {
  id: string;
  type: PyTypeName;
  name: string;
  signature: string;
  returns: PyTypeName;
  mutatesInPlace: boolean;
  summary: string;
  sampleCode: (sampleLiteral: string) => string;
  tip: string;
}

export interface PrintPerfectLevel {
  id: string;
  title: string;
  targetOutput: string;
  hint: string;
  starterCode: string;
}

export interface InputDetectiveCase {
  id: string;
  title: string;
  context: string;
  buggyCode: string;
  sampleInput: string;
  actualOutput: string;
  expectedOutput: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  fixedCode: string;
}

export interface DoDontItem {
  id: string;
  kind: 'do' | 'dont';
  title: string;
  code: string;
  summary: string;
  reason: string;
}

export interface NamePoliceCard {
  id: string;
  candidate: string;
  isValid: boolean;
  category: string;
  reason: string;
  tip?: string;
}

export interface ModuleDefinition {
  id: string;
  code: string;
  title: string;
  description: string;
  stageReady: boolean;
  stageNumber: number;
  lessons: LessonDefinition[];
}

export interface MCQExercise {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TheoryExercise {
  id: string;
  prompt: string;
  keyPoints: string[];
  modelAnswer: string;
}

export interface CodingExercise {
  id: string;
  title: string;
  prompt: string;
  starterCode: string;
  expectedOutput: string;
  hint: string;
}

export interface DebuggingExercise {
  id: string;
  title: string;
  prompt: string;
  buggyCode: string;
  expectedOutput: string;
  hint: string;
}

export interface ModuleExerciseBank {
  moduleId: string;
  mcq: MCQExercise[];
  theory: TheoryExercise[];
  coding: CodingExercise[];
  debugging: DebuggingExercise[];
}

export interface ModuleSummarySheet {
  moduleId: string;
  code: string;
  title: string;
  bigIdea: string;
  keyRules: Array<{ syntax: string; meaning: string }>;
  commonTraps: string[];
  classroomDemoCode: string;
  discussionPrompts: string[];
}
