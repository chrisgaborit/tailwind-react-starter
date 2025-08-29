import LevelBadge from '@/components/LevelBadge';
import { detectLevel } from '@/utils/detectLevel';

// Suppose you already have `storyboardModule` from the backend
const { level, metrics, reasons } = detectLevel(storyboardModule);

return (
  <header className="flex items-center justify-between mb-4">
    <div>
      <h1 className="text-xl font-semibold">{storyboardModule.moduleName}</h1>
      <p className="text-sm text-slate-500">
        {metrics.scenes} scenes • {metrics.interactions} interactions • {metrics.knowledgeChecks} KCs
      </p>
    </div>

    <LevelBadge
      level={level}
      tooltip={`Scenes: ${metrics.scenes} | Interactions: ${metrics.interactions} (complex ${metrics.complex}) | KCs: ${metrics.knowledgeChecks} | Branching: ${metrics.branching}\n${reasons.join(' ')} `}
    />
  </header>
);