const { InteractivityInstructionBlock } = require('../types/storyboardTypesArchive');

export const interactivityTemplates: InteractivityInstructionBlock[] = [
  {
    interactivityType: 'Click-and-Reveal',
    type: 'Click-and-Reveal',
    description: 'Allows learner-paced exploration by revealing content on interaction.',
    layout: 'Tabs or expandable sections',
    learningPurpose: 'Break down dense information and allow learner-paced exploration.',
    bestForModuleLevels: [1, 2, 3],
    contentTypes: ['Policies', 'Principles', 'Procedures', 'Glossaries'],
    learningOutcomes: ['Understand', 'Remember'],
    layoutDescription: 'List or grid layout with tabs, icons, or expandable cards.',
    userBehaviour: 'Learners click on tabs or icons to reveal associated content.',
    visualElementBreakdown: [
      'Icon or tab label',
      'Reveal panel with text or image',
      'Optional voiceover sync',
    ],
    developerNotes: 'Use ARIA labels for accessibility. Sync reveal with audio if required.',
    exampleAssets: ['SS:431611849', 'accordion_layout.svg'],
  },
  {
    interactivityType: 'Drag-and-Drop',
    type: 'Drag-and-Drop',
    description: 'Interactive sorting or matching activity reinforcing applied knowledge.',
    layout: 'Drag zones with drop targets',
    learningPurpose:
      'Engage learners in sorting, sequencing, or matching tasks to reinforce applied knowledge.',
    bestForModuleLevels: [2, 3, 4],
    contentTypes: ['Processes', 'Steps', 'Vocabulary', 'Categorisation'],
    learningOutcomes: ['Apply', 'Analyse'],
    layoutDescription:
      'Interactive drag areas with drop targets for categories, orders or matches.',
    userBehaviour: 'Drag items to appropriate drop zones. Instant feedback on submit or drop.',
    visualElementBreakdown: [
      'Draggable items (text or image)',
      'Drop targets with labels',
      'Feedback icons or tooltips',
    ],
    developerNotes:
      'Ensure items are resettable. Randomise order. Track correct/incorrect per attempt.',
    exampleAssets: ['SS:668032477', 'drag_zone_ui.png'],
  },
  {
    interactivityType: 'Branching Scenario',
    type: 'Branching Scenario',
    description: 'Real-world decision making with simulated outcomes.',
    layout: 'Decision-based flow with narrative scenes',
    learningPurpose: 'Simulate real-world decision-making with consequences to test judgement.',
    bestForModuleLevels: [3, 4],
    contentTypes: ['Customer service', 'Sales', 'Ethics', 'Compliance', 'Medical'],
    learningOutcomes: ['Apply', 'Evaluate'],
    layoutDescription: 'Scene-by-scene storyline with clickable decisions that alter the path.',
    userBehaviour: 'Select from 2–3 decision choices to explore consequences.',
    visualElementBreakdown: [
      'Scenario text with characters/dialogue',
      'Clickable decision buttons',
      'Outcome feedback screens',
    ],
    developerNotes: 'Track paths. Provide restart or map view. Use warm tone in narration.',
    exampleAssets: ['SS:554990788', 'storyflow_template.jpg'],
  },
  {
    interactivityType: 'Hotspot (Labeled Graphic)',
    type: 'Hotspot (Labeled Graphic)',
    description: 'Clickable labels explain visual parts of a system or diagram.',
    layout: 'Image with overlay hotspots',
    learningPurpose: 'Explain parts of a visual system or process diagram through exploration.',
    bestForModuleLevels: [2, 3],
    contentTypes: ['Diagrams', 'Dashboards', 'Anatomy', 'Maps'],
    learningOutcomes: ['Understand'],
    layoutDescription: 'Base image with transparent clickable overlays that show labels or detail.',
    userBehaviour: 'Click a visual element to reveal a tooltip or modal with information.',
    visualElementBreakdown: [
      'Image with defined hotspots',
      'Tooltips or modal windows',
      'Optional animations or icons',
    ],
    developerNotes: 'Ensure proper focus states. Add alt text. Space hotspots well for mobile use.',
    exampleAssets: ['SS:617698028', 'hotspot_ui_overlay.png'],
  },
  {
    interactivityType: 'Custom Learning Path',
    type: 'Custom Learning Path',
    description: 'Adapts module flow based on learner selection.',
    layout: 'Avatar or tile-based selection screen',
    learningPurpose: 'Adapt training paths to suit roles, preferences or skill levels.',
    bestForModuleLevels: [3, 4],
    contentTypes: ['Onboarding', 'Compliance', 'Adaptive Training'],
    learningOutcomes: ['Adapt', 'Personalise'],
    layoutDescription:
      'Initial choice screen with avatars or tiles; navigates user to a relevant path.',
    userBehaviour: 'Select a role or topic to launch a tailored series of slides.',
    visualElementBreakdown: [
      'Role avatar icons',
      'Pathway options',
      'Progress indicator per stream',
    ],
    developerNotes:
      'Record selection. Show visual differences across paths. Optional preview screen.',
    exampleAssets: ['SS:605535554', 'learning_path_selector.png'],
  },
];

// Export a helper function if needed:
export function getInteractivityTemplate(type: string): InteractivityInstructionBlock | undefined {
  return interactivityTemplates.find(
    (template) => template.interactivityType.toLowerCase() === type.toLowerCase()
  );
}
