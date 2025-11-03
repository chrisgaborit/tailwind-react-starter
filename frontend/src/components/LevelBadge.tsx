// frontend/src/components/LevelBadge.tsx
import React from 'react';

type Props = {
  level: string;
  tooltip?: string;
  className?: string;
};

const getLevelColor = (level: string): string => {
  if (level.includes('Level 1') || level.includes('1')) {
    return 'bg-slate-100 text-slate-800 border-slate-300';
  } else if (level.includes('Level 2') || level.includes('2')) {
    return 'bg-amber-100 text-amber-900 border-amber-300';
  } else if (level.includes('Level 3') || level.includes('3')) {
    return 'bg-emerald-100 text-emerald-900 border-emerald-300';
  } else if (level.includes('Level 4') || level.includes('4')) {
    return 'bg-purple-100 text-purple-900 border-purple-300';
  }
  return 'bg-gray-100 text-gray-800 border-gray-300';
};

export default function LevelBadge({ level, tooltip, className }: Props) {
  return (
    <span
      title={tooltip}
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-sm font-medium ${getLevelColor(level)} ${className || ''}`}
    >
      <span className="inline-block w-2 h-2 rounded-full bg-current opacity-75" />
      {level}
    </span>
  );
}