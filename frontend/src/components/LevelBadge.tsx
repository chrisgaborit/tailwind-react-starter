// frontend/src/components/LevelBadge.tsx
import React from 'react';

type Props = {
  level: 'Level 1: Passive' | 'Level 2: Limited Interactivity' | 'Level 3: Complex Interactivity';
  tooltip?: string;
  className?: string;
};

const COLORS: Record<Props['level'], string> = {
  'Level 1: Passive':              'bg-slate-100 text-slate-800 border-slate-300',
  'Level 2: Limited Interactivity':'bg-amber-100 text-amber-900 border-amber-300',
  'Level 3: Complex Interactivity':'bg-emerald-100 text-emerald-900 border-emerald-300',
};

export default function LevelBadge({ level, tooltip, className }: Props) {
  return (
    <span
      title={tooltip}
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-sm font-medium ${COLORS[level]} ${className || ''}`}
    >
      <span className="inline-block w-2 h-2 rounded-full bg-current opacity-75" />
      {level}
    </span>
  );
}