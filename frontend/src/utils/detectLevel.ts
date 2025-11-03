// Simple level detection utility
export function detectLevel(storyboardModule: any) {
  // Basic level detection based on scene count and complexity
  const sceneCount = storyboardModule?.scenes?.length || 0;
  
  let level = "Level 2";
  let metrics = { sceneCount };
  let reasons = [];
  
  if (sceneCount >= 20) {
    level = "Level 4";
    reasons.push("High scene count indicates complex content");
  } else if (sceneCount >= 15) {
    level = "Level 3";
    reasons.push("Moderate scene count suggests intermediate complexity");
  } else if (sceneCount >= 8) {
    level = "Level 2";
    reasons.push("Standard scene count for basic content");
  } else {
    level = "Level 1";
    reasons.push("Low scene count suggests simple content");
  }
  
  return { level, metrics, reasons };
}






















