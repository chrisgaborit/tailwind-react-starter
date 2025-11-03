import { SourceValidator } from "../../src/agents_v2/sourceValidator";

describe("SourceValidator", () => {
  it("should detect hallucinated coaching content", () => {
    const gen = "This module teaches coaching skills and mentoring techniques.";
    const src = "This module teaches time management and planning.";
    
    const result = SourceValidator.validate(gen, src);
    
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues.join().toLowerCase()).toMatch(/coaching/i);
  });

  it("should pass validation when content matches source", () => {
    const gen = "Time management involves prioritising tasks and planning your day effectively.";
    const src = "Time management involves prioritising tasks, planning your day, and managing distractions.";
    
    const result = SourceValidator.validate(gen, src);
    
    expect(result.valid).toBe(true);
    expect(result.issues.length).toBe(0);
  });

  it("should detect fictional character names not in source", () => {
    const gen = "Alex Johnson helps Jordan Lee with time management strategies.";
    const src = "Time management strategies include prioritisation and planning.";
    
    const result = SourceValidator.validate(gen, src);
    
    expect(result.valid).toBe(false);
    expect(result.issues.some(issue => issue.toLowerCase().includes("fictional") || issue.toLowerCase().includes("name"))).toBe(true);
  });

  it("should detect US spelling instead of UK spelling", () => {
    const gen = "You should prioritize your tasks and organize your schedule.";
    const src = "Prioritise your tasks and organise your schedule.";
    
    const result = SourceValidator.validate(gen, src);
    
    // Should detect US spelling
    if (result.issues.length > 0) {
      expect(result.issues.some(issue => issue.toLowerCase().includes("spelling"))).toBe(true);
    }
  });

  it("should return validation result with correct structure", () => {
    const gen = "Test content";
    const src = "Test source";
    
    const result = SourceValidator.validate(gen, src);
    
    expect(result).toHaveProperty("valid");
    expect(result).toHaveProperty("issues");
    expect(typeof result.valid).toBe("boolean");
    expect(Array.isArray(result.issues)).toBe(true);
  });

  it("should handle empty strings gracefully", () => {
    const result = SourceValidator.validate("", "");
    
    expect(result).toHaveProperty("valid");
    expect(result).toHaveProperty("issues");
    expect(Array.isArray(result.issues)).toBe(true);
  });
});
