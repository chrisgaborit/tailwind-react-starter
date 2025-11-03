// backend/models/Storyboard.ts

export interface Storyboard {
  id?: number;                // SERIAL PRIMARY KEY (optional on insert)
  content: any;               // JSON object for the full storyboard
  tags: string[];             // Example: ['onboarding', 'level2', 'friendly']
  level: number;              // e.g., 1, 2, 3, 4
  isBestExample: boolean;     // true if it's a "best" reference example
  createdBy?: string;         // (camelCase) -- maps to created_by in DB
  createdAt?: Date;           // DB timestamp (optional, set by DB)
  embedding?: number[];       // (future use) for AI-powered search
}
