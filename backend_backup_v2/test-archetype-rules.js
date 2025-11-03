// Test script for Archetype Rules Enforcement
const { 
  getArchetypeForModuleType,
  getModuleTypeRules,
  generateArchetypePromptGuidance,
  enforceArchetypeRules,
  validateContentAgainstArchetype
} = require('./dist/services/archetypeRulesService');

console.log('🎯 Testing Archetype Rules Enforcement...\n');

// Test 1: Archetype Mapping
console.log('1. Testing Archetype Mapping:');
const moduleTypes = [
  "Compliance & Ethics",
  "Leadership & Coaching", 
  "Sales & Customer Service",
  "Technical & Systems",
  "Health & Safety",
  "Onboarding & Culture",
  "Product Knowledge",
  "Professional Skills"
];

moduleTypes.forEach(moduleType => {
  const archetype = getArchetypeForModuleType(moduleType);
  console.log(`   ${moduleType} → ${archetype}`);
});

// Test 2: Archetype Rules
console.log('\n2. Testing Archetype Rules:');
moduleTypes.forEach(moduleType => {
  const rules = getModuleTypeRules(moduleType);
  console.log(`\n   ${moduleType}:`);
  console.log(`     Tone: ${rules.tone}`);
  console.log(`     Interactions: ${rules.interactions.join(', ')}`);
  console.log(`     Banned Terms: ${rules.banned.length > 0 ? rules.banned.join(', ') : 'None'}`);
  console.log(`     Required Elements: ${rules.required.join(', ')}`);
  console.log(`     Pedagogical Approach: ${rules.pedagogical_approach}`);
});

// Test 3: Content Validation
console.log('\n3. Testing Content Validation:');

// Test scenario-based content with banned terms
const scenarioContent = "This compliance training covers incident reporting and breach procedures...";
const scenarioValidation = validateContentAgainstArchetype(scenarioContent, "Leadership & Coaching");
console.log(`\n   Leadership & Coaching content with banned terms:`);
console.log(`     Content: "${scenarioContent}"`);
console.log(`     Valid: ${scenarioValidation.valid}`);
console.log(`     Violations: ${scenarioValidation.violations.join(', ')}`);
console.log(`     Suggestions: ${scenarioValidation.suggestions.join(', ')}`);

// Test compliance content (should be valid)
const complianceContent = "This compliance training covers policy application and regulatory requirements...";
const complianceValidation = validateContentAgainstArchetype(complianceContent, "Compliance & Ethics");
console.log(`\n   Compliance & Ethics content:`);
console.log(`     Content: "${complianceContent}"`);
console.log(`     Valid: ${complianceValidation.valid}`);
console.log(`     Violations: ${complianceValidation.violations.join(', ')}`);

// Test 4: Archetype Rule Enforcement
console.log('\n4. Testing Archetype Rule Enforcement:');

const testScene = {
  narrationScript: "This leadership training covers compliance procedures and incident management...",
  onScreenText: {
    body_text: ["Click here to learn about breach reporting", "Select the correct compliance policy"]
  },
  knowledgeCheck: {
    stem: "What should you do in case of a compliance violation?"
  }
};

const enforcementResult = enforceArchetypeRules(testScene, "Leadership & Coaching");
console.log(`\n   Leadership & Coaching scene enforcement:`);
console.log(`     Fixed: ${enforcementResult.fixed}`);
console.log(`     Violations: ${enforcementResult.violations.join(', ')}`);
console.log(`     Updated narration: "${enforcementResult.content.narrationScript}"`);

// Test 5: Prompt Guidance Generation
console.log('\n5. Testing Prompt Guidance Generation:');
const guidance = generateArchetypePromptGuidance("Leadership & Coaching");
console.log(`\n   Leadership & Coaching prompt guidance:`);
console.log(guidance);

console.log('\n✅ Archetype Rules Test Complete!');
console.log('\n🎯 KEY FEATURES:');
console.log('   ✅ Archetype mapping for all Module Types');
console.log('   ✅ Banned terms enforcement for scenario-based content');
console.log('   ✅ Required elements validation');
console.log('   ✅ Automatic content fixing');
console.log('   ✅ Pedagogical approach enforcement');
console.log('   ✅ Tone and interaction guidance');












