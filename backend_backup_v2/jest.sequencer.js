const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    // Always run agents in deterministic order
    // This prevents parallel OpenAI API calls and ensures consistent test execution
    const order = [
      'welcomeAgent',
      'teachAgent',
      'applyAgent',
      'summaryAgent',
      'qaAgent',
      'sourceValidator',
      'directorAgent', // Run integration test last
    ];
    
    return tests.sort((a, b) => {
      const ia = order.findIndex(n => a.path.includes(n));
      const ib = order.findIndex(n => b.path.includes(n));
      
      // If both tests are in the order list, sort by their position
      if (ia !== -1 && ib !== -1) {
        return ia - ib;
      }
      
      // If only one is in the order list, prioritize it
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      
      // Otherwise, maintain original order
      return 0;
    });
  }
}

module.exports = CustomSequencer;

