import { useState, useEffect, useRef, type ReactNode } from 'react';
import { ChevronRight, Check } from 'lucide-react';

export interface TourStep {
  selector: string;
  title: string;
  description: string;
}

interface Props {
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
}

export default function GuidedTour({ steps, onComplete, onSkip }: Props) {
  const [current, setCurrent] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const step = steps[current];

  useEffect(() => {
    const update = () => {
      const el = document.querySelector(step.selector);
      if (el) {
        el.classList.add('tour-highlight');
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };
    update();
    window.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      const el = document.querySelector(step.selector);
      if (el) el.classList.remove('tour-highlight');
    };
  }, [current, step.selector]);

  const next = () => {
    const el = document.querySelector(step.selector);
    if (el) el.classList.remove('tour-highlight');
    if (current + 1 >= steps.length) {
      onComplete();
    } else {
      setCurrent(prev => prev + 1);
    }
  };

  const skip = () => {
    const el = document.querySelector(step.selector);
    if (el) el.classList.remove('tour-highlight');
    onSkip();
  };

  let tooltipStyle: React.CSSProperties = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  if (targetRect) {
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const placeBelow = spaceBelow > 200;
    tooltipStyle = {
      top: placeBelow ? targetRect.bottom + 12 : Math.max(12, targetRect.top - 220),
      left: Math.min(Math.max(12, targetRect.left), window.innerWidth - 312),
    };
  }

  return (
    <>
      <div ref={overlayRef} className="tour-overlay" onClick={skip} />
      <div className="tour-tooltip" style={tooltipStyle} onClick={e => e.stopPropagation()}>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">{step.title}</h3>
          <span className="text-xs font-medium text-slate-400">{current + 1} of {steps.length}</span>
        </div>
        <p className="mb-5 text-sm leading-relaxed text-slate-600">{step.description}</p>
        <div className="flex items-center justify-between">
          <button onClick={skip} className="text-sm font-medium text-slate-400 hover:text-slate-600">Skip tour</button>
          <button onClick={next} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-105">
            {current + 1 >= steps.length ? <><Check className="h-4 w-4" /> Got it</> : <><span>Next</span><ChevronRight className="h-4 w-4" /></>}
          </button>
        </div>
      </div>
    </>
  );
}

export function TourGate({ children, tourKey, steps, onComplete }: { children: ReactNode; tourKey: string; steps: TourStep[]; onComplete?: () => void }) {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(tourKey);
    if (!seen) setShowTour(true);
  }, [tourKey]);

  const finish = () => {
    localStorage.setItem(tourKey, 'done');
    setShowTour(false);
    onComplete?.();
  };

  return (
    <>
      {children}
      {showTour && <GuidedTour steps={steps} onComplete={finish} onSkip={finish} />}
    </>
  );
}
