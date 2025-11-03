// backend/src/test-interactivity-sequencer.ts
// Quick test script for InteractivitySequencer
// Run with: ts-node -r tsconfig-paths/register src/test-interactivity-sequencer.ts

import { InteractivitySequencerExample } from './examples/interactivitySequencerExample';

console.log('Starting InteractivitySequencer test...\n');

const example = new InteractivitySequencerExample();
example.runAllExamples();


