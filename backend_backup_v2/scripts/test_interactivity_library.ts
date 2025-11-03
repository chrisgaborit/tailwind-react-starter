// backend/scripts/test_interactivity_library.ts
import { INTERACTIVITY_LIBRARY } from "../src/library/interactivityLibrary";

// Call any function and log its output
console.log("✅ hotspotsTour():");
console.log(
  INTERACTIVITY_LIBRARY.hotspotsTour(["Dashboard", "Settings", "Reports"])
);

console.log("\n✅ revealPrinciples():");
console.log(
  INTERACTIVITY_LIBRARY.revealPrinciples("Principles", [
    { term: "Empathy", definition: "Understand users" },
    { term: "Clarity", definition: "Be simple" },
  ])
);

// Add more tests here if needed...
