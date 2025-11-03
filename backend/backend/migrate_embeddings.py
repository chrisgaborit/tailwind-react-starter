import psycopg
import json
import os
from openai import OpenAI

# --- CONFIGURATION ---
PG_CONN_STR = "postgresql://postgres.ocxwlwzkjtuhvvlklont:dyhbYn-bibxu9-firgoz@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres"
OPENAI_API_KEY = "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"

client = OpenAI(api_key=OPENAI_API_KEY)

def create_embedding(text):
    """Creates an embedding using the text-embedding-3-large model."""
    response = client.embeddings.create(
        model="text-embedding-3-large", # Ensure this is the large model
        input=text
    )
    return response.data[0].embedding

print("Connecting to the database...")
with psycopg.connect(PG_CONN_STR) as conn:
    with conn.cursor() as cur:
        # Find all storyboards that need a new embedding
        cur.execute("SELECT id, content FROM storyboards;")
        storyboards_to_update = cur.fetchall()

        print(f"Found {len(storyboards_to_update)} storyboards to re-embed. Starting process...")

        for storyboard in storyboards_to_update:
            storyboard_id = storyboard[0]
            storyboard_content = storyboard[1] # This is the JSON content

            # Extract the text you want to embed from the JSON
            text_to_embed = storyboard_content.get('moduleName', '') 
            
            if not text_to_embed:
                print(f"Skipping storyboard {storyboard_id} due to empty content.")
                continue

            print(f"Creating 3072-dim embedding for storyboard ID: {storyboard_id}...")
            
            # Create the new, larger embedding
            new_embedding = create_embedding(text_to_embed)
            
            # Convert to the string format pgvector requires
            embedding_string = json.dumps(new_embedding)

            # Update the database with the new embedding
            cur.execute(
                "UPDATE storyboards SET embedding = %s WHERE id = %s;",
                (embedding_string, storyboard_id)
            )
            print(f"✅ Successfully updated storyboard ID: {storyboard_id}")

        # Commit all the changes to the database
        conn.commit()
        print("\nMigration complete! All embeddings have been upgraded to 3072 dimensions.")