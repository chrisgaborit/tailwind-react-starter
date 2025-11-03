# Outcome-Driven Learn-See-Do-Apply Framework Implementation

## Overview

This document describes the comprehensive implementation of the Outcome-Driven Learn-See-Do-Apply framework for the Learno AI Storyboard Generator. The framework shifts the system from "content presentation" to measurable behavior change with alignment mapping and quality gates.

## 🎯 Framework Goals

- **Outcome-Driven**: 3-5 measurable learning outcomes using Bloom's taxonomy verbs
- **Structured Pedagogy**: Non-negotiable Learn → See → Do → Apply sequence
- **Alignment Mapping**: Every learning outcome appears in all four phases
- **Business Relevance**: Early integration of business impact in learner content
- **Quality Gates**: Comprehensive validation of framework compliance
- **Redundancy Elimination**: Remove framework re-listing and optimize content flow

## 📁 Files Modified/Created

### 1. Schema Updates
- **`/packages/shared/src/types.ts`** - Master type definitions with new framework types
- **`/backend/src/validation/storyboardSchema.ts`** - Zod schemas for runtime validation

### 2. Core Services
- **`/backend/src/services/pedagogyEnforcer.ts`** - Ensures Learn→See→Do→Apply sequence
- **`/backend/src/services/alignmentBuilder.ts`** - Creates alignment maps between LOs and scenes
- **`/backend/src/services/outcomeDrivenQualityValidator.ts`** - Framework compliance validation
- **`/backend/src/services/outcomeDrivenPromptService.ts`** - Enhanced prompt generation
- **`/backend/src/services/redundancyCleanupService.ts`** - Removes redundant content
- **`/backend/src/services/outcomeDrivenIntegrationService.ts`** - Orchestrates all components

### 3. Frontend Components
- **`/frontend/src/components/OutcomeDrivenStoryboardDisplay.tsx`** - Enhanced storyboard viewer

### 4. PDF Export
- **`/backend/src/services/outcomeDrivenPdfService.ts`** - Enhanced PDF generation

## 🔧 Implementation Details

### Schema Enhancements

#### New Types Added
```typescript
// Bloom's Taxonomy verbs for measurable learning outcomes
export type BloomVerb = "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";

// Pedagogy phases for the Learn-See-Do-Apply framework
export type PedagogyPhase = "learn" | "see" | "do" | "apply";

// Enhanced Learning Outcome with Bloom's taxonomy integration
export interface LearningOutcome {
  id: string;              // uuid
  verb: BloomVerb;         // e.g., "apply"
  text: string;            // e.g., "apply the four-stage coaching model..."
  context?: string;        // optional context/situation
  measure?: string;        // optional metric/result
}

// Alignment mapping between learning outcomes and scenes
export interface AlignmentLink {
  outcomeId: string;       // references LearningOutcome.id
  sceneId: string;         // references StoryboardScene.scene_id
  phase: PedagogyPhase;    // learn | see | do | apply
  evidence?: string;       // short note on how the scene serves the LO
}

// Enhanced project metadata
export interface ProjectMetadata {
  title: string;
  businessImpact?: string;   // e.g., "Improve coaching quality; +10% engagement"
  category?: "Leadership" | "Soft Skills" | "Compliance" | "Technical" | "Sales" | "HSE" | "Onboarding" | "Product" | "Professional";
}
```

#### Enhanced StoryboardScene
```typescript
export interface StoryboardScene {
  // ... existing fields ...
  phase?: LearningPhaseType | PedagogyPhase;  // Support both legacy and new pedagogy phases
  learningOutcomeRefs?: string[]; // array of LO ids this scene supports
}
```

#### Enhanced StoryboardModule
```typescript
export interface StoryboardModule {
  // ... existing fields ...
  project_metadata?: ProjectMetadata;
  learningOutcomes?: LearningOutcome[];
  alignmentMap?: AlignmentLink[];
}
```

### Core Services

#### 1. Pedagogy Enforcer (`pedagogyEnforcer.ts`)
**Purpose**: Ensures the Learn-See-Do-Apply sequence is properly implemented for Leadership/Soft Skills modules.

**Key Features**:
- Enforces internal pages (TOC + Pronunciations) before learner content
- Ensures Scene 3 gets templateType: "LEARNER_START"
- Partitions learner scenes into four clusters (learn/see/do/apply)
- Enforces progressive complexity within DO/APPLY clusters
- Removes assessment items from LEARN/SEE phases

**Usage**:
```typescript
import { pedagogyEnforcer } from './services/pedagogyEnforcer';

const result = pedagogyEnforcer.ensureLearnSeeDoApply(storyboard);
if (result.success) {
  storyboard = result.modifiedStoryboard;
  console.log('Changes:', result.changes);
}
```

#### 2. Alignment Builder (`alignmentBuilder.ts`)
**Purpose**: Creates and maintains alignment maps between learning outcomes and scenes across phases.

**Key Features**:
- Analyzes current alignment coverage across all learning outcomes and phases
- Builds initial alignment map from existing scene references
- Fills coverage gaps by creating minimal support scenes
- Enhances evidence descriptions for alignment links
- Validates alignment map completeness

**Usage**:
```typescript
import { alignmentBuilder } from './services/alignmentBuilder';

const result = alignmentBuilder.buildAlignmentMap(storyboard);
if (result.success) {
  storyboard.alignmentMap = result.alignmentMap;
  console.log('Coverage analysis:', result.analysis);
}
```

#### 3. Quality Validator (`outcomeDrivenQualityValidator.ts`)
**Purpose**: Validates storyboard against Learn-See-Do-Apply framework requirements.

**Validation Checks**:
- **Outcome Count**: 3-5 Bloom-based outcomes present
- **Alignment Coverage**: Each LO appears in all four phases
- **Sequence Validity**: No APPLY before DO; no quizzes in LEARN/SEE
- **Business Relevance**: Scenes 3-4 reference business impact
- **Redundancy Elimination**: No redundant framework re-teaching
- **Feedback Quality**: Practice scenes include explanatory feedback

**Usage**:
```typescript
import { outcomeDrivenQualityValidator } from './services/outcomeDrivenQualityValidator';

const report = outcomeDrivenQualityValidator.validateOutcomeDrivenQuality(storyboard);
console.log('Overall Score:', report.overallScore);
console.log('Issues:', report.issues);
```

#### 4. Prompt Service (`outcomeDrivenPromptService.ts`)
**Purpose**: Enhances prompt generation with framework integration.

**Key Features**:
- Injects learning outcomes, business impact, and category into every agent prompt
- Provides phase-specific instructions for scene generation
- Ensures specialists receive current phase and targeted learning outcome references
- Requires branching scenarios for APPLY phase

**Usage**:
```typescript
import { outcomeDrivenPromptService } from './services/outcomeDrivenPromptService';

const prompts = outcomeDrivenPromptService.buildOutcomeDrivenPrompts({
  formData,
  learningOutcomes,
  projectMetadata,
  currentPhase: 'learn',
  targetedOutcomes: ['lo-1', 'lo-2']
});
```

#### 5. Redundancy Cleanup (`redundancyCleanupService.ts`)
**Purpose**: Removes redundant framework re-listing and optimizes content flow.

**Key Features**:
- Detects and removes repeated framework re-teach screens
- Consolidates similar scenes based on content similarity
- Removes duplicate learning outcome references
- Optimizes content flow by removing redundant transitions
- Ensures proper phase progression

**Usage**:
```typescript
import { redundancyCleanupService } from './services/redundancyCleanupService';

const result = redundancyCleanupService.cleanupRedundancy(storyboard);
if (result.success) {
  storyboard = result.modifiedStoryboard;
  console.log('Removed scenes:', result.removedScenes);
}
```

#### 6. Integration Service (`outcomeDrivenIntegrationService.ts`)
**Purpose**: Orchestrates all framework components and provides a single entry point.

**Key Features**:
- Applies complete framework workflow
- Generates learning outcomes from form data
- Creates project metadata
- Builds enhanced prompts
- Validates framework compliance
- Generates PDF with framework features

**Usage**:
```typescript
import { outcomeDrivenIntegrationService } from './services/outcomeDrivenIntegrationService';

const result = await outcomeDrivenIntegrationService.applyFramework(storyboard, {
  applyPedagogyEnforcement: true,
  buildAlignmentMap: true,
  runQualityValidation: true,
  cleanupRedundancy: true,
  generatePdf: true
});
```

### Frontend Enhancements

#### Enhanced Storyboard Display (`OutcomeDrivenStoryboardDisplay.tsx`)
**Features**:
- **Alignment Map Section**: Shows LO coverage across phases with expandable details
- **Phase Badges**: Visual indicators for Learn/See/Do/Apply phases on scene cards
- **Business Impact Display**: Dedicated section for business impact information
- **Learning Outcomes Section**: Structured display of measurable outcomes
- **Framework Compliance Indicators**: Visual feedback on framework adherence

**Usage**:
```tsx
import OutcomeDrivenStoryboardDisplay from './components/OutcomeDrivenStoryboardDisplay';

<OutcomeDrivenStoryboardDisplay 
  storyboardModule={storyboard}
  showAlignmentMap={true}
/>
```

### PDF Export Enhancements

#### Enhanced PDF Service (`outcomeDrivenPdfService.ts`)
**Features**:
- **Business Impact Page**: Dedicated section for business impact
- **Learning Outcomes Page**: Structured display of measurable outcomes
- **Alignment Map Visualization**: Coverage matrix showing LO-phase relationships
- **Proper File Naming**: Sanitized filenames based on module title
- **Phase Indicators**: Visual phase badges in scene tables
- **Framework Summary**: Compliance overview and metrics

**Usage**:
```typescript
import { renderOutcomeDrivenStoryboardAsHTML, generatePdfFileName } from './services/outcomeDrivenPdfService';

const fileName = generatePdfFileName(storyboard);
const htmlContent = renderOutcomeDrivenStoryboardAsHTML(storyboard, formData, {
  includeAlignmentMap: true,
  includeBusinessImpact: true,
  includeLearningOutcomes: true,
  includeFrameworkSummary: true
});
```

## 🚀 Usage Workflow

### 1. Basic Framework Application
```typescript
import { outcomeDrivenIntegrationService } from './services/outcomeDrivenIntegrationService';

// Apply framework to existing storyboard
const result = await outcomeDrivenIntegrationService.applyFramework(storyboard, {
  applyPedagogyEnforcement: true,
  buildAlignmentMap: true,
  runQualityValidation: true,
  cleanupRedundancy: true
});

if (result.success) {
  console.log('Framework applied successfully');
  console.log('Changes:', result.changes);
  console.log('Quality Score:', result.qualityReport.overallScore);
}
```

### 2. Generate Learning Outcomes
```typescript
// Generate learning outcomes from form data
const learningOutcomes = outcomeDrivenIntegrationService.generateLearningOutcomes(
  formData,
  projectMetadata
);

// Create project metadata
const projectMetadata = outcomeDrivenIntegrationService.createProjectMetadata(formData);
```

### 3. Enhanced Prompt Generation
```typescript
// Build enhanced prompts with framework context
const prompts = outcomeDrivenIntegrationService.buildEnhancedPrompts(
  formData,
  learningOutcomes,
  projectMetadata,
  'learn', // current phase
  ['lo-1', 'lo-2'] // targeted outcomes
);
```

### 4. Quality Validation
```typescript
// Validate framework compliance
const compliance = outcomeDrivenIntegrationService.validateFrameworkCompliance(storyboard);

if (compliance.isCompliant) {
  console.log('Storyboard is framework compliant');
} else {
  console.log('Issues:', compliance.issues);
  console.log('Recommendations:', compliance.recommendations);
}
```

## 📊 Quality Gates

The framework includes comprehensive quality gates that check:

1. **Outcome Count**: 3-5 Bloom-based outcomes present
2. **Alignment Coverage**: Each LO appears in all four phases (learn/see/do/apply)
3. **Sequence Validity**: No APPLY scenes before DO; no quizzes in LEARN/SEE
4. **Business Relevance**: Scenes 3-4 reference business impact
5. **Redundancy Elimination**: No redundant framework re-listing
6. **Feedback Quality**: Practice scenes include explanatory feedback

## 🎨 Visual Enhancements

### Phase Badges
- **LEARN**: Blue badge for concept teaching
- **SEE**: Green badge for examples/demonstrations
- **DO**: Yellow badge for practice activities
- **APPLY**: Purple badge for capstone scenarios

### Alignment Map
- Coverage matrix showing LO-phase relationships
- Expandable details with evidence descriptions
- Visual indicators for complete/incomplete coverage

### Business Impact
- Dedicated section highlighting business relevance
- Integration with learning outcomes
- Early reference in learner content

## 🔄 Backward Compatibility

All new fields are optional to ensure backward compatibility:
- Existing storyboards continue to work without modification
- New fields are populated when framework is applied
- Legacy phase types are supported alongside new pedagogy phases
- Gradual migration path for existing content

## 🧪 Testing

The implementation includes comprehensive validation:
- Zod schemas for runtime type checking
- Quality gates for framework compliance
- Error handling and graceful degradation
- Detailed logging of changes and warnings

## 📈 Success Metrics

The framework tracks several success metrics:
- **Framework Compliance Score**: Overall adherence to Learn-See-Do-Apply structure
- **Alignment Coverage**: Percentage of LO-phase combinations covered
- **Business Relevance**: Integration of business impact in content
- **Content Quality**: Reduction in redundancy and improved flow
- **User Experience**: Enhanced visualization and navigation

## 🚀 Future Enhancements

Potential future improvements:
- Machine learning-based content optimization
- Advanced similarity detection for redundancy removal
- Dynamic difficulty adjustment based on learner performance
- Integration with learning analytics platforms
- Automated A/B testing of framework variations

## 📝 Conclusion

The Outcome-Driven Learn-See-Do-Apply framework implementation provides a comprehensive solution for creating high-quality, pedagogically sound eLearning content. By focusing on measurable learning outcomes, structured pedagogy, and business relevance, the framework ensures that generated storyboards lead to meaningful behavior change and improved performance.

The modular architecture allows for easy extension and customization while maintaining backward compatibility with existing content. The comprehensive quality gates and validation ensure consistent application of the framework across all generated content.





