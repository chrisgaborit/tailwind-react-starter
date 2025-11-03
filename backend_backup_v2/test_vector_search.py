import psycopg
import json
import os
from openai import OpenAI

# --- CONFIGURATION ---
# Your correct, working Supabase Transaction Pooler URL.
PG_CONN_STR = "postgresql://postgres.ocxwlwzkjtuhvvlklont:dyhbYn-bibxu9-firgoz@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres"

# Your OpenAI API key. Make sure this is correct.
# You can copy this from your .env file.
OPENAI_API_KEY = "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"

# The query you want to search for.
search_query_text = "How to build a great onboarding module for remote teams"

# The number of results you want to retrieve.
top_k = 3

# --- INITIALIZE CLIENTS ---
client = OpenAI(api_key=OPENAI_API_KEY)

print(f"\n🔎 Creating a 3072-dimension embedding for the query: '{search_query_text}'...")

try:
    # --- 1. CREATE THE QUERY EMBEDDING ---
    # <<< THE FINAL FIX IS HERE >>>
    # We are using "text-embedding-3-large" to create a 3072-dimension vector,
    # which now matches your database column.
    response = client.embeddings.create(
        model="text-embedding-3-large",
        input=search_query_text
    )
    query_embedding = response.data[0].embedding
    print("✅ Embedding created successfully.")

    # --- 2. FORMAT FOR PGVECTOR ---
    # Convert the Python list to the '[...]' string format that pgvector requires.
    embedding_string = json.dumps(query_embedding)

    # --- 3. PREPARE THE SQL QUERY ---
    # Use a parameterized query for security and correctness.
    sql_query = """
        SELECT
            id,
            content,
            1 - (embedding <=> %s::vector) AS similarity
        FROM
            storyboards
        ORDER BY
            embedding <=> %s::vector
        LIMIT %s;
    """

    print("\n🔎 Running semantic similarity query against the database...")
    # --- 4. CONNECT AND EXECUTE ---
    with psycopg.connect(PG_CONN_STR) as conn:
        with conn.cursor() as cur:
            # Pass the query and a tuple of parameters to `execute`.
            cur.execute(sql_query, (embedding_string, embedding_string, top_k))
            
            rows = cur.fetchall()

            if not rows:
                print("\nNo similar storyboards found. (This is normal if your DB is empty or content is very different).")
            else:
                print(f"\n✅ Top {len(rows)} most similar storyboards found:")
                for row in rows:
                    # row[0] is id, row[1] is content, row[2] is similarity
                    print("--------------------------------------------------")
                    print(f"ID: {row[0]}")
                    print(f"Similarity Score: {row[2]:.4f}")
                    print(f"Content: {row[1]}")
                    
    print("--------------------------------------------------")
    print("\n🎉 Script finished successfully! 🎉\n")


except psycopg.Error as e:
    print("\n❌ An error occurred with the database:")
    print(e)
except Exception as e:
    print("\n❌ An unexpected error occurred:")
    print(e)