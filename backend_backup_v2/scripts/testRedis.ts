import 'dotenv/config';
import { createClient } from 'redis';

async function main() {
  const url = process.env.QUEUE_URL;
  if (!url) {
    console.error("❌ QUEUE_URL not set in .env");
    process.exit(1);
  }

  const client = createClient({ url });

  client.on('error', (err) => console.error('Redis Client Error', err));

  await client.connect();

  // Test write + read
  await client.set('test-key', 'hello-redis', { EX: 10 });
  const value = await client.get('test-key');

  console.log("✅ Redis working, got:", value);

  await client.quit();
}

main().catch((err) => {
  console.error("❌ Redis test failed", err);
  process.exit(1);
});