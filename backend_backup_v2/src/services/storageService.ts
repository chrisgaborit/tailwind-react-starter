const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "storyboard-images";

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function uploadBase64Png(
  base64DataUrl: string,
  pathPrefix = "generated"
): Promise<string | null> {
  try {
    if (!supabase) throw new Error("Supabase client not configured");
    const [, b64] = base64DataUrl.split("base64,");
    if (!b64) throw new Error("Invalid base64 data URL");

    const bytes = Buffer.from(b64, "base64");
    const ts = Date.now();
    const filePath = `${pathPrefix}/${ts}-${Math.random().toString(36).slice(2)}.png`;

    const { error } = await supabase.storage.from(bucket).upload(filePath, bytes, {
      contentType: "image/png",
      upsert: false,
    });
    if (error) throw error;

    // Prefer public URL if the bucket is public
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return pub?.publicUrl || null;
  } catch (e) {
    console.error("[storage] uploadBase64Png failed:", e);
    return null;
  }
}