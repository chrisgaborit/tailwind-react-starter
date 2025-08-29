import { Pool } from 'pg';
import { Storyboard } from '../models/Storyboard';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Save a storyboard (insert only)
export async function saveStoryboard(storyboard: Storyboard): Promise<void> {
  await pool.query(
    `INSERT INTO storyboards (content, tags, level, is_best_example, created_by)
     VALUES ($1, $2, $3, $4, $5)
    `,
    [
      storyboard.content,
      storyboard.tags,
      storyboard.level,
      storyboard.isBestExample,
      storyboard.createdBy,
    ]
  );
}

// Fetch best examples for given tags/level
export async function getBestStoryboards(
  tags: string[],
  level: number,
  limit = 2
): Promise<Storyboard[]> {
  const { rows } = await pool.query(
    `SELECT * FROM storyboards
     WHERE is_best_example = true
       AND tags && $1
       AND level = $2
     ORDER BY created_at DESC
     LIMIT $3`,
    [tags, level, limit]
  );
  return rows.map(row => ({
    ...row,
    isBestExample: row.is_best_example,
    createdAt: row.created_at,
  }));
}

// Mark a storyboard as "best example"
export async function setBestExample(id: string, isBest: boolean): Promise<void> {
  await pool.query(
    `UPDATE storyboards SET is_best_example = $1 WHERE id = $2`,
    [isBest, id]
  );
}
