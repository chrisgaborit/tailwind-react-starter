// backend/src/agents_v2/sourceValidator.ts
export class SourceValidator {
  static validate(storyText: string, source: string) {
    const issues: string[] = [];
    const genLower = storyText.toLowerCase();
    const srcLower = source.toLowerCase();

    console.log("🔬 SourceValidator: Validating content against source material");

    // Check for hallucinated coaching references
    if (genLower.includes("coach") && !srcLower.includes("coach")) {
      issues.push("Hallucinated coaching references detected.");
    }

    // Check for fictional names
    const fictionalNames = ["john", "jane", "alex johnson", "jordan lee", "sarah chen"];
    for (const name of fictionalNames) {
      if (genLower.includes(name) && !srcLower.includes(name)) {
        issues.push(`Detected fictional name "${name}" – not in source.`);
      }
    }

    // Check for topic mismatch (simplified check)
    // This is a basic check - in production you'd want more sophisticated NLP
    const commonTopicWords = ["time", "management", "priorit", "schedul", "plan"];
    let topicMismatches = 0;
    for (const word of commonTopicWords) {
      if (genLower.includes(word) && !srcLower.includes(word)) {
        topicMismatches++;
      }
    }
    
    if (topicMismatches > 2) {
      issues.push("Topic mismatch detected (contains terms absent from source).");
    }

    // Check for UK English spelling (basic checks)
    const usSpellings = [
      { us: "prioritize", uk: "prioritise" },
      { us: "organize", uk: "organise" },
      { us: "realize", uk: "realise" },
      { us: "color", uk: "colour" }
    ];

    for (const spelling of usSpellings) {
      if (genLower.includes(spelling.us) && !genLower.includes(spelling.uk)) {
        issues.push(`US spelling detected: "${spelling.us}" should be "${spelling.uk}".`);
      }
    }

    console.log(`🔬 SourceValidator: Found ${issues.length} issues`);
    if (issues.length > 0) {
      console.log("🔬 SourceValidator: Issues:", issues);
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}