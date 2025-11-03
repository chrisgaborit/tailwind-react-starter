/**
 * Test script for Strict Mode functionality
 * Run with: node test-strict-mode.js
 */

const { StrictOrchestrator } = require('./dist/services/strictOrchestrator.js');
const { SourceValidator } = require('./dist/services/sourceValidator.js');

async function testStrictMode() {
  console.log('🧪 Testing Strict Mode Implementation...\n');
  
  const orchestrator = new StrictOrchestrator();
  
  // Test 1: Valid source material (time management)
  console.log('📋 Test 1: Valid Time Management Source Material');
  const timeManagementRequest = {
    topic: 'Time Management',
    duration: 30,
    audience: 'Office workers',
    sourceMaterial: `Time management is the process of organizing and planning how to divide your time between specific activities. Good time management enables you to work smarter, not harder, so that you get more done in less time, even when time is tight and pressures are high.

Key time management techniques include:
1. Prioritization using the Eisenhower Matrix
2. The Pomodoro Technique for focused work sessions
3. Time blocking to allocate specific time slots
4. Avoiding multitasking which reduces productivity
5. Setting SMART goals that are specific and measurable

The Eisenhower Matrix helps categorize tasks into four quadrants: urgent and important, important but not urgent, urgent but not important, and neither urgent nor important. This helps focus on what truly matters.

Common time wasters include excessive social media use, unnecessary meetings, poor planning, and lack of delegation. Effective time managers delegate tasks appropriately and learn to say no to non-essential requests.`
  };
  
  try {
    const result1 = await orchestrator.generateStoryboard(timeManagementRequest);
    console.log(`✅ Generated ${result1.scenes.length} scenes`);
    console.log(`📊 Source validation: ${result1.metadata?.sourceValidation?.confidenceScore?.toFixed(1)}% confidence`);
    console.log(`📈 Source coverage: ${result1.metadata?.sourceValidation?.sourceCoverage?.toFixed(1)}%`);
    console.log(`🛡️ Protected welcome scenes: ${result1.metadata?.protectedWelcomeScenes}`);
    console.log('');
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
    console.log('');
  }

  // Test 2: Test source validation directly
  console.log('📋 Test 2: Source Validation');
  const validContent = 'Time management using the Eisenhower Matrix helps prioritize tasks effectively.';
  const invalidContent = 'Alex Johnson coaches Jordan on effective leadership skills and team building strategies.';
  
  const validation1 = SourceValidator.validateSourceUsage(validContent, timeManagementRequest.sourceMaterial);
  const validation2 = SourceValidator.validateSourceUsage(invalidContent, timeManagementRequest.sourceMaterial);
  
  console.log(`✅ Valid content validation: ${validation1.isValid ? 'PASS' : 'FAIL'} (confidence: ${validation1.confidenceScore}%)`);
  console.log(`❌ Invalid content validation: ${validation2.isValid ? 'FAIL' : 'PASS'} (confidence: ${validation2.confidenceScore}%)`);
  console.log(`   Issues found: ${validation2.issues.join(', ')}`);
  console.log('');

  // Test 3: Test with safety source material (should not generate coaching)
  console.log('📋 Test 3: Safety Source Material (Anti-Hallucination Test)');
  const safetyRequest = {
    topic: 'Workplace Safety',
    duration: 25,
    audience: 'Manufacturing workers',
    sourceMaterial: `Workplace safety procedures are essential for preventing accidents and injuries. All employees must follow established safety protocols when operating machinery or handling hazardous materials.

Key safety requirements include:
1. Always wear appropriate Personal Protective Equipment (PPE)
2. Follow lockout/tagout procedures before maintenance
3. Report all incidents and near misses immediately
4. Complete safety training before operating equipment
5. Maintain clean and organized work areas

PPE requirements vary by task but may include hard hats, safety glasses, steel-toed boots, gloves, and hearing protection. All PPE must be inspected before use and replaced if damaged.

The company safety policy requires immediate reporting of any workplace incident, regardless of severity. This helps identify trends and prevent future accidents.`
  };
  
  try {
    const result3 = await orchestrator.generateStoryboard(safetyRequest);
    console.log(`✅ Generated ${result3.scenes.length} scenes`);
    
    // Check for coaching hallucinations
    const allContent = JSON.stringify(result3.scenes);
    const hasCoaching = allContent.toLowerCase().includes('coach') || allContent.toLowerCase().includes('coaching');
    console.log(`🚨 Coaching content detected: ${hasCoaching ? 'FAIL - Hallucination found!' : 'PASS - No coaching content'}`);
    
    console.log(`📊 Source validation: ${result3.metadata?.sourceValidation?.confidenceScore?.toFixed(1)}% confidence`);
    console.log('');
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
    console.log('');
  }

  console.log('🎉 Strict Mode testing completed!');
}

// Run the test
testStrictMode().catch(console.error);
