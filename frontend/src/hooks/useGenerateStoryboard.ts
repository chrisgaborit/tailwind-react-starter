// frontend/src/hooks/useGenerateStoryboard.ts
import { useState } from 'react';
import { generateFromText } from '@/lib/api';
import { validateStoryboardCoverage, extractStoryboardModule } from '@/lib/validators';

type UseGenerateStoryboard = {
  run: (formData: any) => Promise<any>;
  loading: boolean;
  error: string | null;
  issues: string[];
};

export function useGenerateStoryboard(): UseGenerateStoryboard {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<string[]>([]);

  const run = async (formData: any) => {
    setLoading(true);
    setError(null);
    setIssues([]);

    try {
      if (!formData || !String(formData.content || '').trim()) {
        throw new Error('Please provide source content in formData.content');
      }

      const resp = await generateFromText(formData);
      // Works whether backend returned RAW (scenes at root) or envelope
      const sb = extractStoryboardModule(resp) || resp;

      const found = validateStoryboardCoverage(sb);
      setIssues(found);
      if (found.length) console.warn('⚠️ Coverage issues:', found);

      return sb;
    } catch (e: any) {
      const msg = e?.message || 'Load failed';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { run, loading, error, issues };
}
