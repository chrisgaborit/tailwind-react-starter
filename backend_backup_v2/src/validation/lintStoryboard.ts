// backend/src/validation/lintStoryboard.ts
{ StoryboardModule } from "../types";

export type LintResult = { ok: boolean; errors: string[]; warnings: string[] };

export function lintStoryboard(sb: StoryboardModule): LintResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!sb.principles?.length) errors.push("No principles provided");
  if (!sb.serviceCommitments?.length) errors.push("No service commitments provided");
  if (!sb.scenes?.length) errors.push("No scenes generated");

  // At least one incident flow scene
  if (!sb.scenes?.some(s => s.isIncidentFlow)) errors.push("Incident/Escalation walkthrough missing");

  // Coverage in assessments
  const kc = sb.scenes.flatMap(s => s.knowledgeChecks || []);
  const kcText = JSON.stringify(kc).toLowerCase();
  const needs = ["principle", "commitment", "incident"];
  needs.forEach(token => { if (!kcText.includes(token)) warnings.push(`Assessments may not cover: ${token}`); });

  // Decision rationale tags
  const decisions = sb.scenes.flatMap(s => s.decisions || []);
  const allDecisionOpts = decisions.flatMap(d => d.options);
  if (allDecisionOpts.some(o => !o.principleIds?.length)) warnings.push("Some decisions lack principleIds");
  if (allDecisionOpts.some(o => !o.commitmentIds?.length)) warnings.push("Some decisions lack commitmentIds");

  return { ok: errors.length === 0, errors, warnings };
}