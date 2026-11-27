import React from 'react';
import { motion } from 'motion/react';
import { LessonDefinition, TraceStep } from '../types/lab';

interface StorySceneProps {
  lesson: LessonDefinition;
  currentStep: TraceStep | null;
  reduceMotion: boolean;
  pendingInputPrompt?: string | null;
}

function getVarRepr(step: TraceStep | null, name: string): string | null {
  if (!step) return null;
  const v = step.variables.find((item) => item.name === name);
  return v ? v.repr : null;
}

export const StoryScene: React.FC<StorySceneProps> = ({
  lesson,
  currentStep,
  reduceMotion,
  pendingInputPrompt = null,
}) => {
  const vars = currentStep?.variables ?? [];
  const dur = reduceMotion ? 0 : 0.35;
  const printEv = currentStep?.sceneHint?.printEvent as
    | { rawArgs: Array<{ text: string; type: string }>; sep: string; end: string; file: string; flush: boolean; finalText: string }
    | undefined;
  const inputEv = currentStep?.sceneHint?.inputEvent as
    | { prompt: string; typed: string; returnedType: string }
    | undefined;

  // Group variables by shared objectId to reveal aliasing visually
  const topVars = vars.slice(0, 5);
  const sharedIds = new Map<number, string[]>();
  for (const v of vars) {
    const arr = sharedIds.get(v.objectId) ?? [];
    arr.push(v.name);
    sharedIds.set(v.objectId, arr);
  }
  const hasAlias = Array.from(sharedIds.values()).some((g) => g.length > 1);

  return (
    <figure
      className="relative w-full h-full flex flex-col justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden"
      aria-label={`Animated scene: ${lesson.scenarioTitle}`}
    >
      {/* Top Scenario Caption */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-xs">
        <span className="font-semibold text-[var(--text-primary)] truncate">
          {lesson.scenarioTitle}
        </span>
        <span className="text-[var(--text-muted)] font-mono-tabular whitespace-nowrap shrink-0">
          {currentStep ? `Line ${currentStep.line} · ${vars.length} active tag${vars.length === 1 ? '' : 's'}` : 'Ready to run'}
        </span>
      </div>

      {/* Responsive SVG Theatre */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-2 bg-[var(--bg-canvas)]">
        <svg
          viewBox="0 0 640 220"
          className="w-full h-full max-h-full select-none"
          role="img"
          aria-label={currentStep ? currentStep.narration : `${lesson.scenarioTitle} waiting for code execution`}
        >
          {/* Background Horizon / Lab Grid */}
          <defs>
            <pattern id="labDots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" opacity="0.12" />
            </pattern>
          </defs>
          <rect width="640" height="220" rx="10" fill="url(#labDots)" className="text-[var(--text-muted)]" />

          {lesson.sceneType === 'tuck-shop' && (
            <g>
              {/* Tuck shop awning */}
              <path d="M36 28 H264 L274 58 H26 Z" fill="var(--accent-primary)" opacity="0.9" />
              <path d="M56 28 V58 M96 28 V58 M136 28 V58 M176 28 V58 M216 28 V58" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="6" />
              <text x="150" y="48" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="700" fontFamily="var(--font-display)">
                CHINEDU&apos;S TUCK SHOP
              </text>

              {/* Shopkeeper character */}
              <motion.g
                animate={currentStep?.eventKind === 'print' ? { y: [0, -4, 0] } : { y: 0 }}
                transition={{ duration: dur }}
              >
                <circle cx="105" cy="96" r="18" fill="#8D5524" />
                <circle cx="99" cy="94" r="2.2" fill="#FFFFFF" />
                <circle cx="111" cy="94" r="2.2" fill="#FFFFFF" />
                <path d="M99 103 Q105 108 111 103" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" />
                <rect x="83" y="116" width="44" height="36" rx="10" fill="var(--semantic-success)" />
              </motion.g>

              {/* Wooden Counter */}
              <rect x="34" y="148" width="232" height="46" rx="8" fill="var(--bg-elevated)" stroke="var(--border-hairline)" strokeWidth="2" />
              {/* Meat pie tray */}
              <motion.g
                animate={{ scale: getVarRepr(currentStep, 'quantity') ? 1.05 : 1 }}
                transition={{ duration: dur }}
              >
                <ellipse cx="185" cy="144" rx="34" ry="8" fill="#FDE68A" stroke="#D97706" strokeWidth="2" />
                <path d="M164 142 Q185 122 206 142 Z" fill="#F59E0B" />
                <text x="185" y="172" textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="600">
                  {getVarRepr(currentStep, 'snack_name') ?? 'Snack Counter'}
                </text>
              </motion.g>

              {/* Digital Till Display */}
              <rect x="74" y="160" width="76" height="24" rx="5" fill="var(--console-bg)" />
              <text x="112" y="176" textAnchor="middle" fill="var(--console-text)" fontSize="11" fontFamily="var(--font-mono)">
                {getVarRepr(currentStep, 'total_cost') ? `₦${getVarRepr(currentStep, 'total_cost')}` : '₦0'}
              </text>
            </g>
          )}

          {lesson.sceneType === 'class-register' && (
            <g>
              {/* Classroom Chalkboard */}
              <rect x="28" y="24" width="244" height="172" rx="10" fill="var(--console-bg)" stroke="var(--border-hairline)" strokeWidth="3" />
              <text x="44" y="48" fill="var(--semantic-success)" fontSize="12" fontWeight="700" fontFamily="var(--font-display)">
                JSS2 CLASS REGISTER
              </text>
              <line x1="44" y1="56" x2="256" y2="56" stroke="var(--console-muted)" strokeOpacity="0.4" />

              <text x="44" y="84" fill="var(--console-muted)" fontSize="11" fontFamily="var(--font-mono)">
                Student: {getVarRepr(currentStep, 'student') ?? '—'}
              </text>

              <motion.g
                key={getVarRepr(currentStep, 'attendance') ?? 'empty'}
                initial={reduceMotion ? false : { scale: 0.9, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: dur }}
              >
                <rect x="44" y="100" width="212" height="44" rx="8" fill="rgba(255,255,255,0.08)" stroke="var(--accent-primary)" strokeWidth="1.5" />
                <text x="56" y="120" fill="var(--console-text)" fontSize="13" fontWeight="700" fontFamily="var(--font-mono)">
                  attendance = {getVarRepr(currentStep, 'attendance') ?? '—'}
                </text>
                <text x="56" y="136" fill="var(--console-muted)" fontSize="10" fontFamily="var(--font-mono)">
                  {vars.find((v) => v.name === 'attendance')
                    ? `type: ${vars.find((v) => v.name === 'attendance')?.type} · id: ${vars.find((v) => v.name === 'attendance')?.objectId}`
                    : 'Waiting to assign...'}
                </text>
              </motion.g>

              <text x="44" y="174" fill="var(--console-muted)" fontSize="10.5">
                Notice how the tag moves when reassigned!
              </text>
            </g>
          )}

          {lesson.sceneType === 'naming-lab' && (
            <g>
              {/* School Gate Badge Printer */}
              <rect x="30" y="28" width="240" height="164" rx="12" fill="var(--bg-surface)" stroke="var(--border-hairline)" strokeWidth="2" />
              <rect x="30" y="28" width="240" height="32" rx="12" fill="var(--accent-primary)" />
              <text x="150" y="49" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="700" fontFamily="var(--font-display)">
                NAME BADGE CHECKPOINT
              </text>
              <rect x="52" y="76" width="196" height="58" rx="8" fill="var(--bg-elevated)" stroke="var(--border-hairline)" />
              <text x="150" y="102" textAnchor="middle" fill="var(--text-primary)" fontSize="13" fontWeight="700" fontFamily="var(--font-mono)">
                {topVars[0] ? `${topVars[0].name} = ${topVars[0].repr}` : 'student_name'}
              </text>
              <text x="150" y="122" textAnchor="middle" fill="var(--semantic-success)" fontSize="11" fontWeight="600">
                {topVars.length > 0 ? `${topVars.length} valid tag(s) active` : 'Valid Python tags ready'}
              </text>
              <text x="150" y="166" textAnchor="middle" fill="var(--text-muted)" fontSize="10.5">
                Case-sensitive · snake_case · no keywords
              </text>
            </g>
          )}

          {lesson.sceneType === 'unpacking-cups' && (
            <g>
              {/* Table */}
              <rect x="26" y="152" width="248" height="18" rx="6" fill="var(--bg-inset)" stroke="var(--border-hairline)" />
              <text x="150" y="38" textAnchor="middle" fill="var(--text-primary)" fontSize="12" fontWeight="700" fontFamily="var(--font-display)">
                {hasAlias ? 'SHARED OBJECT IN MEMORY' : 'CUP SWAP & UNPACKING'}
              </text>

              {/* Left Cup */}
              <motion.g
                animate={{ x: getVarRepr(currentStep, 'left_cup') === "'Kunu'" ? 120 : 0 }}
                transition={{ duration: dur, type: 'spring', stiffness: 180, damping: 20 }}
              >
                <rect x="64" y="88" width="54" height="62" rx="8" fill="var(--accent-soft)" stroke="var(--accent-primary)" strokeWidth="2" />
                <text x="91" y="122" textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="700" fontFamily="var(--font-mono)">
                  Zobo
                </text>
              </motion.g>

              {/* Right Cup */}
              <motion.g
                animate={{ x: getVarRepr(currentStep, 'right_cup') === "'Zobo'" ? -120 : 0 }}
                transition={{ duration: dur, type: 'spring', stiffness: 180, damping: 20 }}
              >
                <rect x="184" y="88" width="54" height="62" rx="8" fill="var(--semantic-warning-soft)" stroke="var(--semantic-warning)" strokeWidth="2" />
                <text x="211" y="122" textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="700" fontFamily="var(--font-mono)">
                  Kunu
                </text>
              </motion.g>

              <text x="91" y="190" textAnchor="middle" fill="var(--text-muted)" fontSize="10.5" fontFamily="var(--font-mono)">
                left_cup: {getVarRepr(currentStep, 'left_cup') ?? '—'}
              </text>
              <text x="211" y="190" textAnchor="middle" fill="var(--text-muted)" fontSize="10.5" fontFamily="var(--font-mono)">
                right_cup: {getVarRepr(currentStep, 'right_cup') ?? '—'}
              </text>
            </g>
          )}

          {lesson.sceneType === 'savings-ledger' && (
            <g>
              {/* Savings Safe Box */}
              <rect x="44" y="42" width="212" height="142" rx="14" fill="var(--bg-surface)" stroke="var(--accent-primary)" strokeWidth="2.5" />
              <rect x="64" y="64" width="172" height="44" rx="8" fill="var(--console-bg)" />
              <text x="150" y="92" textAnchor="middle" fill="var(--semantic-success)" fontSize="18" fontWeight="700" fontFamily="var(--font-mono)">
                ₦{getVarRepr(currentStep, 'savings') ?? '0'}
              </text>
              <text x="150" y="132" textAnchor="middle" fill="var(--text-primary)" fontSize="11.5" fontWeight="600">
                {getVarRepr(currentStep, 'SCHOOL_NAME') ?? 'School Savings Box'}
              </text>
              <text x="150" y="154" textAnchor="middle" fill="var(--text-muted)" fontSize="10.5" fontFamily="var(--font-mono)">
                {currentStep?.deletedNames?.length
                  ? `Deleted: ${currentStep.deletedNames.join(', ')}`
                  : getVarRepr(currentStep, 'temp_ticket')
                  ? `Ticket: ${getVarRepr(currentStep, 'temp_ticket')}`
                  : 'Augmented ops (+=, -=, *=, /=)'}
              </text>
            </g>
          )}

          {lesson.sceneType === 'print-pipeline' && (
            <g>
              <rect x="24" y="22" width="256" height="176" rx="10" fill="var(--bg-surface)" stroke="var(--border-hairline)" strokeWidth="1.5" />
              <text x="38" y="42" fill="var(--accent-primary)" fontSize="11" fontWeight="700" fontFamily="var(--font-display)">
                PRINT() 6-STEP PIPELINE
              </text>
              {['1. Eval args', '2. str()', '3. Join sep', '4. Add end', '5. Route file', '6. flush'].map((label, idx) => {
                const active = Boolean(printEv);
                const x = 36 + (idx % 2) * 120;
                const y = 54 + Math.floor(idx / 2) * 38;
                return (
                  <motion.g key={label} animate={{ scale: active ? 1.02 : 1 }} transition={{ duration: dur }}>
                    <rect
                      x={x}
                      y={y}
                      width="112"
                      height="30"
                      rx="6"
                      fill={active ? 'var(--accent-soft)' : 'var(--bg-elevated)'}
                      stroke={active ? 'var(--accent-primary)' : 'var(--border-hairline)'}
                    />
                    <text x={x + 8} y={y + 19} fill="var(--text-primary)" fontSize="10" fontWeight="600" fontFamily="var(--font-mono)">
                      {label}
                    </text>
                  </motion.g>
                );
              })}
              <text x="38" y="184" fill="var(--text-muted)" fontSize="10" fontFamily="var(--font-mono)">
                {printEv
                  ? `sep=${JSON.stringify(printEv.sep)} end=${JSON.stringify(printEv.end)} -> ${printEv.file}`
                  : 'Step forward to watch print() assemble output'}
              </text>
            </g>
          )}

          {lesson.sceneType === 'receipt-printer' && (
            <g>
              {/* POS Printer Body */}
              <rect x="38" y="128" width="224" height="66" rx="10" fill="var(--bg-elevated)" stroke="var(--border-hairline)" strokeWidth="2" />
              <rect x="64" y="138" width="172" height="10" rx="4" fill="var(--console-bg)" />
              <text x="150" y="176" textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="700" fontFamily="var(--font-display)">
                POS RECEIPT PRINTER
              </text>
              {/* Paper Receipt Sliding Out */}
              <motion.g animate={{ y: currentStep ? -4 : 6 }} transition={{ duration: dur }}>
                <rect x="68" y="22" width="164" height="116" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
                {(currentStep?.outputSoFar || 'Ready to print receipt...')
                  .split('\n')
                  .filter(Boolean)
                  .slice(-6)
                  .map((ln, idx) => (
                    <text key={idx} x="76" y={38 + idx * 16} fill="#0F172A" fontSize="9" fontFamily="var(--font-mono)">
                      {ln.length > 23 ? ln.slice(0, 22) + '…' : ln}
                    </text>
                  ))}
              </motion.g>
            </g>
          )}

          {lesson.sceneType === 'report-card' && (
            <g>
              <rect x="28" y="22" width="248" height="176" rx="8" fill="var(--bg-surface)" stroke="var(--border-hairline)" strokeWidth="2" />
              <rect x="28" y="22" width="248" height="28" rx="8" fill="var(--accent-primary)" />
              <text x="152" y="40" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="700" fontFamily="var(--font-display)">
                SECOND TERM REPORT CARD
              </text>
              {(currentStep?.outputSoFar || 'Subject   Score   Grade\nWaiting for print()...')
                .split('\n')
                .filter(Boolean)
                .slice(-6)
                .map((ln, idx) => (
                  <text key={idx} x="40" y={68 + idx * 19} fill="var(--text-primary)" fontSize="9.5" fontFamily="var(--font-mono)">
                    {ln.length > 34 ? ln.slice(0, 33) + '…' : ln}
                  </text>
                ))}
            </g>
          )}

          {(lesson.sceneType === 'input-pipeline' || lesson.sceneType === 'atm-pin' || lesson.sceneType === 'registration-form') && (
            <g>
              <rect x="24" y="22" width="256" height="176" rx="10" fill="var(--bg-surface)" stroke={pendingInputPrompt !== null ? 'var(--semantic-warning)' : 'var(--border-hairline)'} strokeWidth={pendingInputPrompt !== null ? '2.5' : '1.5'} />
              <text x="38" y="42" fill="var(--accent-primary)" fontSize="11" fontWeight="700" fontFamily="var(--font-display)">
                {lesson.sceneType === 'atm-pin'
                  ? 'ATM TERMINAL & KEYPAD'
                  : lesson.sceneType === 'registration-form'
                  ? 'TUCK SHOP MULTI-ITEM TILL'
                  : 'INPUT() INTERACTIVE PIPELINE'}
              </text>

              {/* Prompt Screen */}
              <rect x="38" y="52" width="228" height="44" rx="6" fill="var(--console-bg)" />
              <text x="48" y="70" fill="var(--console-muted)" fontSize="9.5" fontFamily="var(--font-mono)">
                {pendingInputPrompt !== null
                  ? `PAUSED: ${pendingInputPrompt.slice(0, 28)}`
                  : inputEv
                  ? `Prompt: ${inputEv.prompt.slice(0, 28)}`
                  : 'Waiting for input() call...'}
              </text>
              <text x="48" y="86" fill="#34D399" fontSize="10.5" fontWeight="700" fontFamily="var(--font-mono)">
                {pendingInputPrompt !== null
                  ? '> Type in Console below ▌'
                  : inputEv
                  ? `Returned str: ${JSON.stringify(inputEv.typed)}`
                  : 'Returns ALWAYS str'}
              </text>

              {/* Visual Keyboard */}
              <g transform="translate(38, 108)">
                {['1', '2', '3', 'A', 'B', 'C', '↵ Enter'].map((key, idx) => {
                  const isEnter = key.includes('Enter');
                  const x = (idx % 4) * 56;
                  const y = Math.floor(idx / 4) * 32;
                  return (
                    <motion.g
                      key={key}
                      animate={pendingInputPrompt !== null && isEnter ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                      transition={{ duration: 0.9, repeat: pendingInputPrompt !== null && isEnter ? Infinity : 0 }}
                    >
                      <rect
                        x={x}
                        y={y}
                        width={isEnter ? 112 : 50}
                        height="26"
                        rx="5"
                        fill={isEnter ? 'var(--accent-primary)' : 'var(--bg-elevated)'}
                        stroke="var(--border-hairline)"
                      />
                      <text
                        x={x + (isEnter ? 56 : 25)}
                        y={y + 17}
                        textAnchor="middle"
                        fill={isEnter ? '#FFFFFF' : 'var(--text-primary)'}
                        fontSize="10"
                        fontWeight="600"
                        fontFamily="var(--font-mono)"
                      >
                        {key}
                      </text>
                    </motion.g>
                  );
                })}
              </g>
            </g>
          )}

          {lesson.sceneType === 'int-bus-fare' && (
            <g>
              <rect x="24" y="24" width="256" height="172" rx="10" fill="var(--bg-surface)" stroke="var(--border-hairline)" strokeWidth="1.5" />
              <rect x="24" y="24" width="256" height="28" rx="10" fill="var(--accent-primary)" />
              <text x="152" y="42" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="700" fontFamily="var(--font-display)">
                LAGOS DANFO FARE · // vs %
              </text>
              <rect x="42" y="64" width="104" height="52" rx="8" fill="var(--bg-elevated)" stroke="var(--border-hairline)" />
              <text x="94" y="83" textAnchor="middle" fill="var(--text-muted)" fontSize="9.5" fontWeight="600">
                TICKETS (paid // fare)
              </text>
              <text x="94" y="104" textAnchor="middle" fill="var(--accent-primary)" fontSize="16" fontWeight="700" fontFamily="var(--font-mono)">
                {getVarRepr(currentStep, 'tickets') ?? '0'}
              </text>

              <rect x="158" y="64" width="104" height="52" rx="8" fill="var(--bg-elevated)" stroke="var(--border-hairline)" />
              <text x="210" y="83" textAnchor="middle" fill="var(--text-muted)" fontSize="9.5" fontWeight="600">
                CHANGE (paid % fare)
              </text>
              <text x="210" y="104" textAnchor="middle" fill="var(--semantic-success)" fontSize="16" fontWeight="700" fontFamily="var(--font-mono)">
                ₦{getVarRepr(currentStep, 'change') ?? '0'}
              </text>

              <rect x="42" y="128" width="220" height="52" rx="8" fill="var(--console-bg)" />
              <text x="152" y="149" textAnchor="middle" fill="var(--console-muted)" fontSize="9.5" fontFamily="var(--font-mono)">
                exact_split = paid / fare (always float!)
              </text>
              <text x="152" y="168" textAnchor="middle" fill="var(--console-text)" fontSize="12" fontWeight="700" fontFamily="var(--font-mono)">
                {getVarRepr(currentStep, 'exact_split') ?? '—'}
              </text>
            </g>
          )}

          {lesson.sceneType === 'float-fuel-pump' && (
            <g>
              <rect x="28" y="24" width="248" height="172" rx="10" fill="var(--bg-surface)" stroke="var(--border-hairline)" strokeWidth="2" />
              <rect x="44" y="38" width="216" height="58" rx="6" fill="var(--console-bg)" />
              <text x="54" y="57" fill="#34D399" fontSize="10" fontWeight="700" fontFamily="var(--font-mono)">
                LITRES: {getVarRepr(currentStep, 'litres') ?? '0.0'} L
              </text>
              <text x="54" y="82" fill="#FBBF24" fontSize="15" fontWeight="700" fontFamily="var(--font-mono)">
                COST: ₦{getVarRepr(currentStep, 'cost') ?? '0.00'}
              </text>

              <rect x="44" y="108" width="216" height="72" rx="8" fill="var(--bg-elevated)" stroke="var(--border-hairline)" />
              <text x="56" y="128" fill="var(--text-primary)" fontSize="10.5" fontWeight="700">
                Binary Precision Check
              </text>
              <text x="56" y="148" fill="var(--text-secondary)" fontSize="10" fontFamily="var(--font-mono)">
                0.1 + 0.2 = {getVarRepr(currentStep, 'a') ?? '0.30000000000000004'}
              </text>
              <text x="56" y="167" fill="var(--accent-primary)" fontSize="10" fontWeight="600">
                Use math.isclose() instead of ==
              </text>
            </g>
          )}

          {lesson.sceneType === 'complex-vector' && (() => {
            const cVar = vars.find((v) => v.type === 'complex');
            const heapObj = cVar && currentStep ? currentStep.heap[cVar.objectId] : null;
            const preview = heapObj?.previewValue as { real?: number; imag?: number } | undefined;
            const real = typeof preview?.real === 'number' ? preview.real : 3;
            const imag = typeof preview?.imag === 'number' ? preview.imag : 4;
            const cx = 152;
            const cy = 114;
            const px = cx + Math.max(-90, Math.min(90, real * 18));
            const py = cy - Math.max(-70, Math.min(70, imag * 18));
            return (
              <g>
                <rect x="24" y="22" width="256" height="176" rx="10" fill="var(--bg-surface)" stroke="var(--border-hairline)" strokeWidth="1.5" />
                <text x="36" y="40" fill="var(--accent-primary)" fontSize="10.5" fontWeight="700" fontFamily="var(--font-display)">
                  2D COMPLEX VECTOR PLANE
                </text>
                {/* Axes */}
                <line x1="42" y1={cy} x2="262" y2={cy} stroke="var(--text-muted)" strokeOpacity="0.45" strokeWidth="1.2" />
                <line x1={cx} y1="48" x2={cx} y2="184" stroke="var(--text-muted)" strokeOpacity="0.45" strokeWidth="1.2" />
                <text x="256" y={cy - 5} textAnchor="end" fill="var(--text-muted)" fontSize="9">Real</text>
                <text x={cx + 6} y="56" fill="var(--text-muted)" fontSize="9">Imag (j)</text>

                {/* Animated Vector Arrow */}
                <motion.line
                  x1={cx}
                  y1={cy}
                  animate={{ x2: px, y2: py }}
                  transition={{ duration: dur }}
                  stroke="var(--accent-primary)"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
                <motion.circle
                  animate={{ cx: px, cy: py }}
                  transition={{ duration: dur }}
                  r="5"
                  fill="var(--semantic-success)"
                />
                <text x="36" y="190" fill="var(--text-secondary)" fontSize="10" fontFamily="var(--font-mono)">
                  {cVar ? `${cVar.name} = ${cVar.repr}` : 'v1 = 3 + 4j -> plot (real, imag)'}
                </text>
              </g>
            );
          })()}

          {lesson.sceneType === 'bool-logic-gate' && (() => {
            const eligible = getVarRepr(currentStep, 'eligible');
            const isOpen = eligible === 'True';
            return (
              <g>
                <rect x="24" y="24" width="256" height="172" rx="10" fill="var(--bg-surface)" stroke="var(--border-hairline)" strokeWidth="1.5" />
                <text x="152" y="45" textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="700" fontFamily="var(--font-display)">
                  SCHOLARSHIP LOGIC GATE (AND)
                </text>
                {[
                  { label: 'passed_exam', val: getVarRepr(currentStep, 'passed_exam') ?? '—', y: 60 },
                  { label: 'good_attendance', val: getVarRepr(currentStep, 'good_attendance') ?? '—', y: 92 },
                  { label: 'has_fee_clearance', val: getVarRepr(currentStep, 'has_fee_clearance') ?? '—', y: 124 },
                ].map((row) => (
                  <g key={row.label}>
                    <rect x="38" y={row.y} width="144" height="24" rx="5" fill="var(--bg-elevated)" stroke="var(--border-subtle)" />
                    <text x="46" y={row.y + 16} fill="var(--text-secondary)" fontSize="9.5" fontFamily="var(--font-mono)">
                      {row.label}
                    </text>
                    <text
                      x="174"
                      y={row.y + 16}
                      textAnchor="end"
                      fill={row.val === 'True' ? 'var(--semantic-success)' : 'var(--text-muted)'}
                      fontSize="10"
                      fontWeight="700"
                      fontFamily="var(--font-mono)"
                    >
                      {row.val}
                    </text>
                  </g>
                ))}
                {/* Gate Result Box */}
                <rect
                  x="194"
                  y="72"
                  width="74"
                  height="64"
                  rx="8"
                  fill={isOpen ? 'var(--semantic-success-soft)' : 'var(--bg-elevated)'}
                  stroke={isOpen ? 'var(--semantic-success)' : 'var(--border-hairline)'}
                  strokeWidth="2"
                />
                <text x="231" y="98" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontWeight="700">
                  ELIGIBLE
                </text>
                <text
                  x="231"
                  y="118"
                  textAnchor="middle"
                  fill={isOpen ? 'var(--semantic-success-text)' : 'var(--text-primary)'}
                  fontSize="12"
                  fontWeight="700"
                  fontFamily="var(--font-mono)"
                >
                  {eligible ?? '—'}
                </text>
                <text x="152" y="176" textAnchor="middle" fill="var(--text-muted)" fontSize="9.5">
                  All inputs must be True for AND to open
                </text>
              </g>
            );
          })()}

          {lesson.sceneType === 'none-locker' && (
            <g>
              <rect x="24" y="24" width="256" height="172" rx="10" fill="var(--bg-surface)" stroke="var(--border-hairline)" strokeWidth="1.5" />
              <text x="152" y="45" textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="700" fontFamily="var(--font-display)">
                CLINIC CARD: None vs 0 vs &quot;&quot;
              </text>

              {/* None Locker */}
              <rect x="38" y="60" width="106" height="92" rx="8" fill="var(--bg-canvas)" stroke="var(--border-hairline)" strokeDasharray="5 3" strokeWidth="1.8" />
              <text x="91" y="80" textAnchor="middle" fill="var(--text-muted)" fontSize="9.5" fontWeight="700">
                blood_group
              </text>
              <text x="91" y="112" textAnchor="middle" fill="var(--accent-primary)" fontSize="14" fontWeight="700" fontFamily="var(--font-mono)">
                {getVarRepr(currentStep, 'blood_group') ?? 'None'}
              </text>
              <text x="91" y="136" textAnchor="middle" fill="var(--text-muted)" fontSize="9">
                Not recorded yet
              </text>

              {/* 0 Value Locker */}
              <rect x="160" y="60" width="106" height="92" rx="8" fill="var(--bg-elevated)" stroke="var(--accent-primary)" strokeWidth="1.8" />
              <text x="213" y="80" textAnchor="middle" fill="var(--text-muted)" fontSize="9.5" fontWeight="700">
                temperature
              </text>
              <text x="213" y="112" textAnchor="middle" fill="var(--semantic-success)" fontSize="16" fontWeight="700" fontFamily="var(--font-mono)">
                {getVarRepr(currentStep, 'temperature') ?? '0'}
              </text>
              <text x="213" y="136" textAnchor="middle" fill="var(--text-muted)" fontSize="9">
                Real int measurement
              </text>

              <text x="152" y="176" textAnchor="middle" fill="var(--text-secondary)" fontSize="10" fontFamily="var(--font-mono)">
                Check missing values with: x is None
              </text>
            </g>
          )}

          {lesson.sceneType === 'str-index-tape' && (() => {
            const firstStr = vars.find((v) => v.type === 'str');
            const rawText = firstStr && currentStep ? String(currentStep.heap[firstStr.objectId]?.previewValue ?? 'NG-2026-WAEC') : 'NG-2026-WAEC';
            const chars = Array.from(rawText).slice(0, 12);
            const cellW = Math.min(20, Math.floor(236 / Math.max(1, chars.length)));
            const startX = 152 - (chars.length * cellW) / 2;
            return (
              <g>
                <rect x="24" y="22" width="256" height="176" rx="10" fill="var(--bg-surface)" stroke="var(--border-hairline)" strokeWidth="1.5" />
                <text x="152" y="42" textAnchor="middle" fill="var(--accent-primary)" fontSize="10.5" fontWeight="700" fontFamily="var(--font-display)">
                  STRING INDEX RULER (0-BASED &amp; NEGATIVE)
                </text>
                {chars.map((ch, idx) => {
                  const x = startX + idx * cellW;
                  const neg = idx - chars.length;
                  return (
                    <g key={idx}>
                      <text x={x + cellW / 2} y="66" textAnchor="middle" fill="var(--text-muted)" fontSize="8.5" fontFamily="var(--font-mono)">
                        {idx}
                      </text>
                      <rect x={x + 1} y="72" width={cellW - 2} height="28" rx="4" fill="var(--accent-soft)" stroke="var(--accent-primary)" />
                      <text x={x + cellW / 2} y="90" textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="700" fontFamily="var(--font-mono)">
                        {ch}
                      </text>
                      <text x={x + cellW / 2} y="114" textAnchor="middle" fill="var(--semantic-warning-text)" fontSize="8" fontFamily="var(--font-mono)">
                        {neg}
                      </text>
                    </g>
                  );
                })}
                <rect x="38" y="130" width="228" height="52" rx="8" fill="var(--bg-elevated)" stroke="var(--border-subtle)" />
                <text x="152" y="150" textAnchor="middle" fill="var(--text-primary)" fontSize="10.5" fontWeight="600" fontFamily="var(--font-mono)">
                  reversed: {getVarRepr(currentStep, 'reversed_id') ?? 'exam_id[::-1]'}
                </text>
                <text x="152" y="169" textAnchor="middle" fill="var(--text-muted)" fontSize="9.5">
                  Strings are immutable — slices create new strings
                </text>
              </g>
            );
          })()}

          {lesson.sceneType === 'str-cleaner' && (
            <g>
              <rect x="24" y="24" width="256" height="172" rx="10" fill="var(--bg-surface)" stroke="var(--border-hairline)" strokeWidth="1.5" />
              <text x="152" y="45" textAnchor="middle" fill="var(--accent-primary)" fontSize="10.5" fontWeight="700" fontFamily="var(--font-display)">
                TEXT CLEANING PIPELINE
              </text>
              <rect x="38" y="58" width="228" height="36" rx="6" fill="var(--bg-elevated)" stroke="var(--border-hairline)" />
              <text x="48" y="73" fill="var(--text-muted)" fontSize="9">RAW INPUT</text>
              <text x="48" y="88" fill="var(--text-primary)" fontSize="10.5" fontFamily="var(--font-mono)">
                {getVarRepr(currentStep, 'raw_name') ?? "'   amaka  okafor  '"}
              </text>

              <text x="152" y="109" textAnchor="middle" fill="var(--accent-primary)" fontSize="10" fontWeight="700" fontFamily="var(--font-mono)">
                ↓ .strip().title() ↓
              </text>

              <rect x="38" y="118" width="228" height="40" rx="6" fill="var(--semantic-success-soft)" stroke="var(--semantic-success)" />
              <text x="48" y="134" fill="var(--semantic-success-text)" fontSize="9" fontWeight="700">CLEANED NEW STR</text>
              <text x="48" y="150" fill="var(--text-primary)" fontSize="11" fontWeight="700" fontFamily="var(--font-mono)">
                {getVarRepr(currentStep, 'clean_name') ?? 'Waiting...'}
              </text>

              <text x="152" y="178" textAnchor="middle" fill="var(--text-muted)" fontSize="9.5" fontFamily="var(--font-mono)">
                Phone: {getVarRepr(currentStep, 'local_phone') ?? '—'}
              </text>
            </g>
          )}

          {lesson.sceneType === 'str-search-replace' && (
            <g>
              <rect x="24" y="24" width="256" height="172" rx="10" fill="var(--bg-surface)" stroke="var(--border-hairline)" strokeWidth="1.5" />
              <text x="152" y="44" textAnchor="middle" fill="var(--accent-primary)" fontSize="10.5" fontWeight="700" fontFamily="var(--font-display)">
                SEARCH · REPLACE · ALIGN
              </text>
              <rect x="36" y="56" width="232" height="58" rx="8" fill="var(--bg-elevated)" stroke="var(--border-hairline)" />
              <text x="46" y="74" fill="var(--text-muted)" fontSize="9">CURRENT NOTICE</text>
              <text x="46" y="92" fill="var(--text-primary)" fontSize="9.5" fontFamily="var(--font-mono)">
                {(getVarRepr(currentStep, 'updated') ?? getVarRepr(currentStep, 'notice') ?? 'Maths class moves to Lab 2...').slice(0, 34)}
              </text>
              <text x="46" y="106" fill="var(--accent-primary)" fontSize="9" fontFamily="var(--font-mono)">
                .find() -&gt; index or -1 · .count()
              </text>

              <rect x="36" y="126" width="232" height="54" rx="8" fill="var(--console-bg)" />
              <text x="152" y="147" textAnchor="middle" fill="#34D399" fontSize="11" fontWeight="700" fontFamily="var(--font-mono)">
                {getVarRepr(currentStep, 'banner') ?? '-------JSS3 NOTICE-------'}
              </text>
              <text x="152" y="167" textAnchor="middle" fill="var(--console-text)" fontSize="10.5" fontFamily="var(--font-mono)">
                Ticket: {getVarRepr(currentStep, 'badge_num') ?? '00042'}
              </text>
            </g>
          )}

          {lesson.sceneType === 'str-split-join' && (
            <g>
              <rect x="24" y="24" width="256" height="172" rx="10" fill="var(--bg-surface)" stroke="var(--border-hairline)" strokeWidth="1.5" />
              <text x="152" y="44" textAnchor="middle" fill="var(--accent-primary)" fontSize="10.5" fontWeight="700" fontFamily="var(--font-display)">
                SPLIT &amp; JOIN ROUND-TRIP
              </text>
              <rect x="38" y="56" width="228" height="34" rx="6" fill="var(--bg-elevated)" stroke="var(--border-hairline)" />
              <text x="152" y="77" textAnchor="middle" fill="var(--text-primary)" fontSize="10.5" fontFamily="var(--font-mono)">
                {getVarRepr(currentStep, 'csv_row') ?? "'Peak Milk,3,450'"}
              </text>

              <text x="152" y="105" textAnchor="middle" fill="var(--accent-primary)" fontSize="9.5" fontWeight="700" fontFamily="var(--font-mono)">
                .split(&quot;,&quot;) → list · &quot;-&quot;.join() → str
              </text>

              <rect x="38" y="114" width="228" height="36" rx="6" fill="var(--accent-soft)" stroke="var(--accent-primary)" />
              <text x="152" y="136" textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="600" fontFamily="var(--font-mono)">
                {getVarRepr(currentStep, 'fields') ?? "['Peak Milk', '3', '450']"}
              </text>

              <text x="152" y="176" textAnchor="middle" fill="var(--text-muted)" fontSize="9.5" fontFamily="var(--font-mono)">
                slug: {getVarRepr(currentStep, 'slug') ?? 'JSS2-Science-Club'}
              </text>
            </g>
          )}

          {lesson.sceneType === 'list-queue' && (() => {
            const qVar = vars.find((v) => v.name === 'queue') ?? vars.find((v) => v.type === 'list');
            const rawList = qVar ? qVar.repr : "['Chidi', 'Amaka', 'Tunde', 'Bola']";
            const items = rawList
              .replace(/^\[|\]$/g, '')
              .split(',')
              .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
              .filter(Boolean)
              .slice(0, 5);
            const idChanged = getVarRepr(currentStep, 'before_id') && qVar
              ? String(qVar.objectId) !== getVarRepr(currentStep, 'before_id')
              : false;
            return (
              <g>
                <rect x="24" y="22" width="256" height="176" rx="10" fill="var(--bg-surface)" stroke="var(--border-hairline)" strokeWidth="1.5" />
                <text x="152" y="42" textAnchor="middle" fill="var(--accent-primary)" fontSize="10.5" fontWeight="700" fontFamily="var(--font-display)">
                  DANFO QUEUE · MUTABLE LIST
                </text>
                {items.map((item, idx) => {
                  const slotW = Math.min(54, Math.floor(228 / Math.max(1, items.length)));
                  const x = 38 + idx * (slotW + 4);
                  return (
                    <motion.g
                      key={`${idx}-${item}`}
                      initial={reduceMotion ? false : { y: -6, opacity: 0.5 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: dur * 0.8 }}
                    >
                      <text x={x + slotW / 2} y="66" textAnchor="middle" fill="var(--text-muted)" fontSize="8.5" fontFamily="var(--font-mono)">
                        [{idx}]
                      </text>
                      <rect x={x} y="72" width={slotW} height="34" rx="6" fill="var(--accent-soft)" stroke="var(--accent-primary)" strokeWidth="1.5" />
                      <text x={x + slotW / 2} y="93" textAnchor="middle" fill="var(--text-primary)" fontSize="9.5" fontWeight="700" fontFamily="var(--font-mono)">
                        {item.length > 7 ? item.slice(0, 6) + '…' : item}
                      </text>
                      <text x={x + slotW / 2} y="120" textAnchor="middle" fill="var(--semantic-warning-text)" fontSize="8" fontFamily="var(--font-mono)">
                        [{idx - items.length}]
                      </text>
                    </motion.g>
                  );
                })}
                <rect x="36" y="132" width="232" height="50" rx="8" fill="var(--bg-elevated)" stroke="var(--border-subtle)" />
                <text x="152" y="151" textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="600" fontFamily="var(--font-mono)">
                  id: {qVar ? qVar.objectId : '—'} ({idChanged ? 'NEW COPY' : 'SAME LIST BOX'})
                </text>
                <text x="152" y="170" textAnchor="middle" fill="var(--text-muted)" fontSize="9.5">
                  Editing queue[1] mutates the same list in place
                </text>
              </g>
            );
          })()}

          {lesson.sceneType === 'list-methods' && (() => {
            const bVar = vars.find((v) => v.name === 'basket') ?? vars.find((v) => v.type === 'list');
            const pVar = vars.find((v) => v.name === 'prices');
            return (
              <g>
                <rect x="24" y="22" width="256" height="176" rx="10" fill="var(--bg-surface)" stroke="var(--border-hairline)" strokeWidth="1.5" />
                <text x="152" y="42" textAnchor="middle" fill="var(--accent-primary)" fontSize="10.5" fontWeight="700" fontFamily="var(--font-display)">
                  MARKET BASKET · IN-PLACE METHODS
                </text>
                <rect x="36" y="54" width="232" height="54" rx="8" fill="var(--bg-elevated)" stroke="var(--border-hairline)" />
                <text x="46" y="71" fill="var(--text-muted)" fontSize="9">CURRENT BASKET (LIST)</text>
                <text x="46" y="92" fill="var(--text-primary)" fontSize="9.5" fontWeight="600" fontFamily="var(--font-mono)">
                  {(bVar?.repr ?? "['Tomatoes', 'Onions']").slice(0, 34)}
                </text>

                <text x="152" y="124" textAnchor="middle" fill="var(--semantic-warning-text)" fontSize="9.5" fontWeight="700" fontFamily="var(--font-mono)">
                  .append() · .pop() · .sort() return None!
                </text>

                <rect x="36" y="134" width="232" height="48" rx="8" fill="var(--console-bg)" />
                <text x="48" y="154" fill="#34D399" fontSize="9.5" fontWeight="700" fontFamily="var(--font-mono)">
                  prices: {(pVar?.repr ?? '[1500, 450, 900, 1200]').slice(0, 28)}
                </text>
                <text x="48" y="171" fill="var(--console-text)" fontSize="9.5" fontFamily="var(--font-mono)">
                  popped: {getVarRepr(currentStep, 'last_item') ?? '—'} · sorted() = new copy
                </text>
              </g>
            );
          })()}

          {lesson.sceneType === 'tuple-coords' && (() => {
            const lat = getVarRepr(currentStep, 'lat') ?? '9.0833';
            const lon = getVarRepr(currentStep, 'lon') ?? '7.5361';
            const grades = getVarRepr(currentStep, 'grades') ?? "('A1', 'B2', 'A1', ...)";
            return (
              <g>
                <rect x="24" y="22" width="256" height="176" rx="10" fill="var(--bg-surface)" stroke="var(--border-hairline)" strokeWidth="1.5" />
                <text x="152" y="42" textAnchor="middle" fill="var(--accent-primary)" fontSize="10.5" fontWeight="700" fontFamily="var(--font-display)">
                  LOCKED GPS PIN · IMMUTABLE TUPLE
                </text>
                <rect x="38" y="54" width="228" height="60" rx="8" fill="var(--semantic-success-soft)" stroke="var(--semantic-success)" />
                <circle cx="62" cy="84" r="12" fill="var(--semantic-success)" />
                <text x="62" y="88" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="700">GPS</text>
                <text x="84" y="78" fill="var(--text-primary)" fontSize="11" fontWeight="700" fontFamily="var(--font-mono)">
                  ({lat}, {lon})
                </text>
                <text x="84" y="98" fill="var(--semantic-success-text)" fontSize="9.5">
                  Comma makes the tuple: (&quot;WAEC&quot;,)
                </text>

                <rect x="38" y="126" width="228" height="56" rx="8" fill="var(--bg-elevated)" stroke="var(--border-subtle)" />
                <text x="152" y="146" textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="600" fontFamily="var(--font-mono)">
                  grades: {grades.slice(0, 26)}
                </text>
                <text x="152" y="166" textAnchor="middle" fill="var(--text-muted)" fontSize="9.5" fontFamily="var(--font-mono)">
                  Unpack: top, *middle, final
                </text>
              </g>
            );
          })()}

          {lesson.sceneType === 'range-numberline' && (() => {
            const evens = [0, 2, 4, 6, 8, 10];
            const activeNum = getVarRepr(currentStep, 'pos');
            const activeScore = getVarRepr(currentStep, 'score');
            return (
              <g>
                <rect x="24" y="22" width="256" height="176" rx="10" fill="var(--bg-surface)" stroke="var(--border-hairline)" strokeWidth="1.5" />
                <text x="152" y="42" textAnchor="middle" fill="var(--accent-primary)" fontSize="10.5" fontWeight="700" fontFamily="var(--font-display)">
                  LAZY RANGE NUMBER LINE (STEP = 2)
                </text>
                <line x1="42" y1="88" x2="262" y2="88" stroke="var(--accent-primary)" strokeWidth="2.5" />
                {evens.map((n, idx) => {
                  const cx = 50 + idx * 40;
                  return (
                    <g key={n}>
                      <circle cx={cx} cy="88" r="12" fill="var(--accent-soft)" stroke="var(--accent-primary)" strokeWidth="1.5" />
                      <text x={cx} y="92" textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="700" fontFamily="var(--font-mono)">
                        {n}
                      </text>
                    </g>
                  );
                })}
                <text x="152" y="116" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">
                  range(0, 12, 2) stops BEFORE 12
                </text>
                <rect x="38" y="128" width="228" height="54" rx="8" fill="var(--bg-elevated)" stroke="var(--border-subtle)" />
                <text x="152" y="148" textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="600" fontFamily="var(--font-mono)">
                  {activeNum ? `Seat ${activeNum}: ${getVarRepr(currentStep, 'name') ?? ''} -> ${activeScore ?? ''}%` : 'Stores only start, stop, step (O(1))'}
                </text>
                <text x="152" y="167" textAnchor="middle" fill="var(--text-muted)" fontSize="9.5">
                  enumerate() adds seat # · zip() pairs columns
                </text>
              </g>
            );
          })()}

          {lesson.sceneType === 'dict-records' && (() => {
            const dVar = vars.find((v) => v.name === 'student') ?? vars.find((v) => v.type === 'dict');
            return (
              <g>
                <rect x="24" y="22" width="256" height="176" rx="10" fill="var(--bg-surface)" stroke="var(--border-hairline)" strokeWidth="1.5" />
                <text x="152" y="42" textAnchor="middle" fill="var(--accent-primary)" fontSize="10.5" fontWeight="700" fontFamily="var(--font-display)">
                  KEY → VALUE DICTIONARY BOOK
                </text>
                <rect x="36" y="54" width="232" height="68" rx="8" fill="var(--bg-elevated)" stroke="var(--border-hairline)" />
                <text x="46" y="72" fill="var(--text-muted)" fontSize="9">STUDENT RECORD (HASH MAP)</text>
                <text x="46" y="92" fill="var(--text-primary)" fontSize="9.5" fontWeight="600" fontFamily="var(--font-mono)">
                  {(dVar?.repr ?? "{'name': 'Amaka', 'class': 'SS2'}").slice(0, 34)}
                </text>
                <text x="46" y="110" fill="var(--accent-primary)" fontSize="9" fontFamily="var(--font-mono)">
                  .get(k, fallback) never raises KeyError
                </text>

                <rect x="36" y="132" width="232" height="50" rx="8" fill="var(--console-bg)" />
                <text x="48" y="152" fill="#34D399" fontSize="9.5" fontWeight="700" fontFamily="var(--font-mono)">
                  phone: {getVarRepr(currentStep, 'phone') ?? 'Not provided'}
                </text>
                <text x="48" y="170" fill="var(--console-text)" fontSize="9.5" fontFamily="var(--font-mono)">
                  house: {getVarRepr(currentStep, 'house') ?? '—'} · keys must be hashable
                </text>
              </g>
            );
          })()}

          {lesson.sceneType === 'set-venn' && (() => {
            const both = getVarRepr(currentStep, 'both_clubs') ?? "{'Chidi'}";
            const onlyC = getVarRepr(currentStep, 'only_coding') ?? "{'Ada', 'Bola'}";
            return (
              <g>
                <rect x="24" y="22" width="256" height="176" rx="10" fill="var(--bg-surface)" stroke="var(--border-hairline)" strokeWidth="1.5" />
                <text x="152" y="42" textAnchor="middle" fill="var(--accent-primary)" fontSize="10.5" fontWeight="700" fontFamily="var(--font-display)">
                  CLUBS VENN DIAGRAM · UNIQUE SET
                </text>
                <circle cx="116" cy="94" r="40" fill="var(--accent-soft)" fillOpacity="0.7" stroke="var(--accent-primary)" strokeWidth="1.8" />
                <circle cx="188" cy="94" r="40" fill="var(--semantic-warning-soft)" fillOpacity="0.7" stroke="var(--semantic-warning)" strokeWidth="1.8" />
                <text x="90" y="88" textAnchor="middle" fill="var(--text-primary)" fontSize="9" fontWeight="700">Coding</text>
                <text x="214" y="88" textAnchor="middle" fill="var(--text-primary)" fontSize="9" fontWeight="700">Robotics</text>
                <text x="152" y="96" textAnchor="middle" fill="var(--text-primary)" fontSize="9.5" fontWeight="700" fontFamily="var(--font-mono)">
                  &amp;
                </text>
                <rect x="36" y="142" width="232" height="44" rx="8" fill="var(--bg-elevated)" stroke="var(--border-subtle)" />
                <text x="152" y="160" textAnchor="middle" fill="var(--text-primary)" fontSize="9.5" fontWeight="600" fontFamily="var(--font-mono)">
                  both (&amp;): {both.slice(0, 22)}
                </text>
                <text x="152" y="176" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">
                  only coding (-): {onlyC.slice(0, 20)}
                </text>
              </g>
            );
          })()}

          {lesson.sceneType === 'frozenset-lock' && (() => {
            const staff = getVarRepr(currentStep, 'staff_perms') ?? "frozenset({'read', 'grade'})";
            const role = getVarRepr(currentStep, 'role_labels');
            return (
              <g>
                <rect x="24" y="22" width="256" height="176" rx="10" fill="var(--bg-surface)" stroke="var(--border-hairline)" strokeWidth="1.5" />
                <text x="152" y="42" textAnchor="middle" fill="var(--accent-primary)" fontSize="10.5" fontWeight="700" fontFamily="var(--font-display)">
                  FROZENSET · IMMUTABLE &amp; HASHABLE
                </text>
                <rect x="38" y="54" width="228" height="58" rx="8" fill="var(--semantic-success-soft)" stroke="var(--semantic-success)" />
                <text x="50" y="74" fill="var(--semantic-success-text)" fontSize="9.5" fontWeight="700">
                  LOCKED PERMISSIONS (NO .add / .remove)
                </text>
                <text x="50" y="96" fill="var(--text-primary)" fontSize="9.5" fontWeight="600" fontFamily="var(--font-mono)">
                  {staff.slice(0, 32)}
                </text>

                <rect x="38" y="124" width="228" height="58" rx="8" fill="var(--bg-elevated)" stroke="var(--border-subtle)" />
                <text x="152" y="146" textAnchor="middle" fill="var(--text-primary)" fontSize="9.5" fontWeight="600" fontFamily="var(--font-mono)">
                  {role ? 'Valid dict key: role_labels[staff_perms]' : 'Hashable: safe as dict key or set item'}
                </text>
                <text x="152" y="166" textAnchor="middle" fill="var(--text-muted)" fontSize="9">
                  Use | and - to derive new frozensets
                </text>
              </g>
            );
          })()}

          {lesson.sceneType === 'bytes-packets' && (() => {
            const pkt = getVarRepr(currentStep, 'packet') ?? "b'\\xe2\\x82\\xa6500'";
            const buf = getVarRepr(currentStep, 'buf') ?? "bytearray(b'NG-01')";
            return (
              <g>
                <rect x="24" y="22" width="256" height="176" rx="10" fill="var(--bg-surface)" stroke="var(--border-hairline)" strokeWidth="1.5" />
                <text x="152" y="42" textAnchor="middle" fill="var(--accent-primary)" fontSize="10.5" fontWeight="700" fontFamily="var(--font-display)">
                  UTF-8 BYTES &amp; MUTABLE BYTEARRAY
                </text>
                <rect x="36" y="54" width="232" height="54" rx="8" fill="var(--console-bg)" />
                <text x="46" y="72" fill="#34D399" fontSize="9" fontWeight="700">IMMUTABLE bytes (0..255)</text>
                <text x="46" y="92" fill="var(--console-text)" fontSize="9.5" fontFamily="var(--font-mono)">
                  {pkt.slice(0, 32)}
                </text>

                <text x="152" y="123" textAnchor="middle" fill="var(--accent-primary)" fontSize="9" fontWeight="700" fontFamily="var(--font-mono)">
                  str.encode() ⇄ bytes.decode()
                </text>

                <rect x="36" y="132" width="232" height="50" rx="8" fill="var(--bg-elevated)" stroke="var(--accent-primary)" />
                <text x="46" y="150" fill="var(--text-muted)" fontSize="9">MUTABLE bytearray BUFFER</text>
                <text x="46" y="169" fill="var(--text-primary)" fontSize="9.5" fontWeight="600" fontFamily="var(--font-mono)">
                  {buf.slice(0, 32)}
                </text>
              </g>
            );
          })()}

          {lesson.sceneType === 'conversion-bridge' && (() => {
            const rawPrice = getVarRepr(currentStep, 'raw_price') ?? '"2500"';
            const naira = getVarRepr(currentStep, 'naira') ?? '2500';
            const kg = getVarRepr(currentStep, 'kg') ?? '12.5';
            return (
              <g>
                <rect x="24" y="22" width="256" height="176" rx="10" fill="var(--bg-surface)" stroke="var(--border-hairline)" strokeWidth="1.5" />
                <text x="152" y="42" textAnchor="middle" fill="var(--accent-primary)" fontSize="10.5" fontWeight="700" fontFamily="var(--font-display)">
                  TYPE CONVERSION BRIDGE
                </text>
                <rect x="36" y="54" width="96" height="54" rx="8" fill="var(--bg-elevated)" stroke="var(--border-hairline)" />
                <text x="84" y="72" textAnchor="middle" fill="var(--text-muted)" fontSize="9">INPUT (str)</text>
                <text x="84" y="92" textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="700" fontFamily="var(--font-mono)">
                  {rawPrice.slice(0, 12)}
                </text>
                <path d="M136 81 H166" stroke="var(--accent-primary)" strokeWidth="2.2" />
                <polygon points="164,76 172,81 164,86" fill="var(--accent-primary)" />
                <text x="152" y="72" textAnchor="middle" fill="var(--accent-primary)" fontSize="8.5" fontWeight="700" fontFamily="var(--font-mono)">
                  int()
                </text>
                <rect x="174" y="54" width="94" height="54" rx="8" fill="var(--semantic-success-soft)" stroke="var(--semantic-success)" />
                <text x="221" y="72" textAnchor="middle" fill="var(--semantic-success-text)" fontSize="9" fontWeight="700">NUMBER (int)</text>
                <text x="221" y="92" textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="700" fontFamily="var(--font-mono)">
                  {naira.slice(0, 12)}
                </text>
                <rect x="36" y="120" width="232" height="62" rx="8" fill="var(--console-bg)" />
                <text x="48" y="141" fill="#34D399" fontSize="9.5" fontWeight="700" fontFamily="var(--font-mono)">
                  float(&quot;12.50&quot;) → {kg} · int(9.8) → 9
                </text>
                <text x="48" y="162" fill="var(--console-text)" fontSize="9" fontFamily="var(--font-mono)">
                  bool(&quot;False&quot;) is True (non-empty str!)
                </text>
              </g>
            );
          })()}

          {lesson.sceneType === 'operator-bench' && (() => {
            const bagA = vars.find((v) => v.name === 'bag_a');
            const bagB = vars.find((v) => v.name === 'bag_b');
            const bagAlias = vars.find((v) => v.name === 'bag_alias');
            return (
              <g>
                <rect x="24" y="22" width="256" height="176" rx="10" fill="var(--bg-surface)" stroke="var(--border-hairline)" strokeWidth="1.5" />
                <text x="152" y="42" textAnchor="middle" fill="var(--accent-primary)" fontSize="10.5" fontWeight="700" fontFamily="var(--font-display)">
                  OPERATOR &amp; IDENTITY BENCH
                </text>
                <rect x="36" y="54" width="232" height="56" rx="8" fill="var(--bg-elevated)" stroke="var(--border-hairline)" />
                <text x="48" y="74" fill="var(--text-primary)" fontSize="9.5" fontWeight="700" fontFamily="var(--font-mono)">
                  10 / 2 = 5.0 (float) · 10 // 3 = 3 (int)
                </text>
                <text x="48" y="94" fill="var(--accent-primary)" fontSize="9.5" fontFamily="var(--font-mono)">
                  &quot;NG-&quot; + &quot;2026&quot; = &quot;NG-2026&quot; · [&quot;A&quot;]*3
                </text>
                <rect x="36" y="120" width="232" height="64" rx="8" fill="var(--console-bg)" />
                <text x="48" y="140" fill="#34D399" fontSize="9.5" fontWeight="700" fontFamily="var(--font-mono)">
                  == checks VALUE · is checks id()
                </text>
                <text x="48" y="158" fill="var(--console-text)" fontSize="9" fontFamily="var(--font-mono)">
                  bag_a == bag_b: {bagA && bagB ? 'True' : 'True'} · bag_a is bag_b: False
                </text>
                <text x="48" y="174" fill="var(--console-text)" fontSize="9" fontFamily="var(--font-mono)">
                  bag_a is bag_alias: {bagA && bagAlias && bagA.objectId === bagAlias.objectId ? 'True (same id!)' : 'pending'}
                </text>
              </g>
            );
          })()}

          {lesson.sceneType === 'mutability-clone' && (() => {
            const ledger = vars.find((v) => v.name === 'ledger');
            const shallow = vars.find((v) => v.name === 'shallow');
            const deep = vars.find((v) => v.name === 'deep');
            return (
              <g>
                <rect x="24" y="22" width="256" height="176" rx="10" fill="var(--bg-surface)" stroke="var(--border-hairline)" strokeWidth="1.5" />
                <text x="152" y="42" textAnchor="middle" fill="var(--accent-primary)" fontSize="10.5" fontWeight="700" fontFamily="var(--font-display)">
                  ALIAS vs SHALLOW vs DEEP COPY
                </text>
                <rect x="36" y="54" width="232" height="38" rx="7" fill="var(--bg-elevated)" stroke="var(--border-hairline)" />
                <text x="46" y="70" fill="var(--text-muted)" fontSize="8.5" fontWeight="700">ORIGINAL ledger</text>
                <text x="46" y="84" fill="var(--text-primary)" fontSize="9" fontFamily="var(--font-mono)">
                  {(ledger?.repr ?? "[['Ada', 88], ['Bola', 91]]").slice(0, 34)}
                </text>

                <rect x="36" y="99" width="232" height="38" rx="7" fill="var(--semantic-warning-soft)" stroke="var(--semantic-warning)" />
                <text x="46" y="114" fill="var(--semantic-warning-text)" fontSize="8.5" fontWeight="700">SHALLOW copy (shares inner lists!)</text>
                <text x="46" y="129" fill="var(--text-primary)" fontSize="9" fontFamily="var(--font-mono)">
                  {(shallow?.repr ?? 'copy.copy(ledger)').slice(0, 34)}
                </text>

                <rect x="36" y="144" width="232" height="40" rx="7" fill="var(--semantic-success-soft)" stroke="var(--semantic-success)" />
                <text x="46" y="159" fill="var(--semantic-success-text)" fontSize="8.5" fontWeight="700">DEEP copy (100% independent!)</text>
                <text x="46" y="175" fill="var(--text-primary)" fontSize="9" fontFamily="var(--font-mono)">
                  {(deep?.repr ?? 'copy.deepcopy(ledger)').slice(0, 34)}
                </text>
              </g>
            );
          })()}

          {lesson.sceneType === 'type-blueprint' && (() => {
            return (
              <g>
                <rect x="24" y="22" width="256" height="176" rx="10" fill="var(--bg-surface)" stroke="var(--border-hairline)" strokeWidth="1.5" />
                <text x="152" y="42" textAnchor="middle" fill="var(--accent-primary)" fontSize="10.5" fontWeight="700" fontFamily="var(--font-display)">
                  DATA MODELLING BLUEPRINT
                </text>
                {[
                  { y: 54, label: 'int (kobo)', note: 'Exact wallet money: 250_000' },
                  { y: 84, label: 'tuple', note: 'Fixed GPS pair: (9.0765, 7.3986)' },
                  { y: 114, label: 'list', note: 'Ordered editable queue' },
                  { y: 144, label: 'set / dict', note: 'Unique IDs · instant key lookup' },
                ].map((row) => (
                  <g key={row.label}>
                    <rect x="36" y={row.y} width="232" height="25" rx="6" fill="var(--bg-elevated)" stroke="var(--border-subtle)" />
                    <text x="44" y={row.y + 16} fill="var(--accent-primary)" fontSize="9.5" fontWeight="700" fontFamily="var(--font-mono)">
                      {row.label}
                    </text>
                    <text x="116" y={row.y + 16} fill="var(--text-primary)" fontSize="9">
                      {row.note}
                    </text>
                  </g>
                ))}
                <text x="152" y="187" textAnchor="middle" fill="var(--text-muted)" fontSize="9">
                  Pick mutability, order &amp; uniqueness intentionally
                </text>
              </g>
            );
          })()}

          {/* Right Side of SVG: Live Name-Tag -> Memory-Object Arrows! */}
          <g transform="translate(296, 16)">
            <rect x="0" y="0" width="328" height="188" rx="10" fill="var(--bg-surface)" stroke="var(--border-hairline)" strokeWidth="1.5" />
            <text x="14" y="22" fill="var(--text-muted)" fontSize="10.5" fontWeight="700">
              LIVE TAGS → MEMORY OBJECTS
            </text>

            {topVars.length === 0 ? (
              <text x="164" y="102" textAnchor="middle" fill="var(--text-muted)" fontSize="12">
                Press Run or Step to watch tags attach to values
              </text>
            ) : (
              topVars.map((v, idx) => {
                const y = 36 + idx * 30;
                const isChanged = currentStep?.changedNames.includes(v.name);
                return (
                  <motion.g
                    key={v.name}
                    initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: dur * 0.7 }}
                  >
                    {/* Name Tag */}
                    <rect
                      x="12"
                      y={y}
                      width="104"
                      height="22"
                      rx="5"
                      fill={isChanged ? 'var(--accent-soft)' : 'var(--bg-elevated)'}
                      stroke={isChanged ? 'var(--accent-primary)' : 'var(--border-hairline)'}
                      strokeWidth={isChanged ? 1.8 : 1}
                    />
                    <text
                      x="64"
                      y={y + 14.5}
                      textAnchor="middle"
                      fill="var(--text-primary)"
                      fontSize="10.5"
                      fontWeight="600"
                      fontFamily="var(--font-mono)"
                    >
                      {v.name.length > 13 ? v.name.slice(0, 12) + '…' : v.name}
                    </text>

                    {/* Arrow */}
                    <line x1="118" y1={y + 11} x2="152" y2={y + 11} stroke="var(--accent-primary)" strokeWidth="1.8" />
                    <polygon points={`152,${y + 7} 160,${y + 11} 152,${y + 15}`} fill="var(--accent-primary)" />

                    {/* Object Box */}
                    <rect
                      x="162"
                      y={y}
                      width="154"
                      height="22"
                      rx="5"
                      fill="var(--bg-canvas)"
                      stroke="var(--border-hairline)"
                    />
                    <text
                      x="170"
                      y={y + 14.5}
                      fill="var(--text-primary)"
                      fontSize="10.5"
                      fontFamily="var(--font-mono)"
                    >
                      {v.repr.length > 14 ? v.repr.slice(0, 13) + '…' : v.repr}
                    </text>
                    <text
                      x="308"
                      y={y + 14.5}
                      textAnchor="end"
                      fill="var(--accent-soft-text)"
                      fontSize="9.5"
                      fontWeight="700"
                      fontFamily="var(--font-mono)"
                    >
                      {v.type}
                    </text>
                  </motion.g>
                );
              })
            )}
          </g>
        </svg>
      </div>

      {/* Accessibility caption */}
      <figcaption className="sr-only">
        {currentStep ? currentStep.narration : `${lesson.scenarioTitle}: ${lesson.subtitle}`}
      </figcaption>
    </figure>
  );
};
