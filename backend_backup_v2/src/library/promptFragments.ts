// ✅ backend/src/library/promptFragments.ts

function getStandardOpeningPrompt() {
  return `You're a world-class instructional designer crafting scenes with rich interactivity.`;
}

function getComplianceTonePrompt() {
  return `Maintain a tone of clarity, accuracy, and authority suitable for compliance training.`;
}

function getVisualStylePrompt() {
  return `Each scene must include vivid descriptions suitable for AI image generation.`;
}

// ✅ New: Opening Slide Rule for first learner-facing screen
const openingSlideRule = `

---
📌 Opening Slide Rule:
The first learner-facing screen (after internal-only slides such as TOC and Pronunciation Guide) must:
- Include a short on-screen text (OST) that welcomes or orients the learner.
- Include a voiceover (VO) that introduces the theme or purpose of the module.
- Include a supporting AI image prompt.
- Be engaging and clear, not left empty.

Do NOT leave this screen blank unless explicitly instructed to do so. It sets the tone for the learning experience.
`;

module.exports = {
  getStandardOpeningPrompt,
  getComplianceTonePrompt,
  getVisualStylePrompt,
  openingSlideRule, // ✅ exported
};