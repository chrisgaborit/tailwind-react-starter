import psycopg
import os

# Replace with your actual values!
DB_URL = "postgresql://postgres:dyhbYn-bibxu9-firgoz@db.ocxwlwzkjuhvvlklont.supabase.co:5432/postgres"

def migrate_embedding_column():
    sql = """
    ALTER TABLE storyboards
    ALTER COLUMN embedding TYPE vector(1536)
    USING embedding::vector;
    """
    with psycopg.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            print("Running migration...")
            cur.execute(sql)
            conn.commit()
            print("Migration complete!")

if __name__ == "__main__":
    migrate_embedding_column()
