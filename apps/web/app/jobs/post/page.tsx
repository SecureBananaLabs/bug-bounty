"use client";

import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "shake" | "zoom";

const DEBOUNCE_MS = 700;
const SHAKE_MS = 350;
const ZOOM_MS = 500;
const SWAP_AT = SHAKE_MS + ZOOM_MS / 2; // swap at the peak, when digits are closest

export default function PostJobPage() {
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");

  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const animating = useRef(false);

  // 700ms after the last keystroke, check order; if inverted, run the correction.
  useEffect(() => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      const lo = parseFloat(min);
      const hi = parseFloat(max);
      if (!animating.current && Number.isFinite(lo) && Number.isFinite(hi) && lo > hi) {
        runCorrection(min, max);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounce.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max]);

  function runCorrection(lo: string, hi: string) {
    animating.current = true;
    timers.current.forEach(clearTimeout);
    timers.current = [];

    setPhase("shake"); // 1) tremble in place
    timers.current.push(setTimeout(() => setPhase("zoom"), SHAKE_MS)); // 2) rush toward user
    timers.current.push(
      setTimeout(() => {
        // 3) at the peak of the zoom, swap the two values into correct order
        setMin(hi);
        setMax(lo);
      }, SWAP_AT)
    );
    timers.current.push(
      setTimeout(() => {
        setPhase("idle");
        animating.current = false;
      }, SHAKE_MS + ZOOM_MS)
    );
  }

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  return (
    <section className="card">
      <h2>Post a Job</h2>
      <p>Draft title, budget, category, and skill requirements for your project.</p>

      <div className={`budget budget--${phase}`} aria-live="polite">
        <label className="budget__field">
          <span>Budget min</span>
          <input
            type="number"
            inputMode="decimal"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            placeholder="100"
          />
        </label>

        <span className="budget__dash">–</span>

        <label className="budget__field">
          <span>Budget max</span>
          <input
            type="number"
            inputMode="decimal"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            placeholder="500"
          />
        </label>
      </div>

      <p className="budget__hint">
        Tip: enter a higher min than max (e.g. 500 then 100) and wait — the field corrects itself.
      </p>

      <style>{css}</style>
    </section>
  );
}

const css = `
.budget {
  display: inline-flex;
  align-items: flex-end;
  gap: 12px;
  margin-top: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  transform-style: preserve-3d;
  will-change: transform;
}
.budget__field { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
.budget__field input {
  width: 120px;
  padding: 8px 10px;
  font-size: 22px;            /* big digits — they carry the zoom */
  font-variant-numeric: tabular-nums;
  text-align: center;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
}
.budget__dash { padding-bottom: 10px; font-size: 22px; color: #64748b; }
.budget__hint { margin-top: 8px; font-size: 12px; color: #64748b; }

/* 1) tremble in place */
.budget--shake { animation: budget-shake ${SHAKE_MS}ms ease-in-out; }
@keyframes budget-shake {
  0%, 100% { transform: translateX(0); }
  18% { transform: translateX(-9px); }
  36% { transform: translateX(9px); }
  54% { transform: translateX(-6px); }
  72% { transform: translateX(6px); }
  86% { transform: translateX(-3px); }
}

/* 2) digits rush toward the user, then settle (the value swap lands at the peak) */
.budget--zoom { animation: budget-zoom ${ZOOM_MS}ms cubic-bezier(.34,1.56,.64,1); }
@keyframes budget-zoom {
  0%   { transform: perspective(600px) translateZ(0); }
  50%  { transform: perspective(600px) translateZ(70px); } /* closest to user */
  100% { transform: perspective(600px) translateZ(0); }
}

@media (prefers-reduced-motion: reduce) {
  .budget--shake, .budget--zoom { animation: none; }
}
`;
