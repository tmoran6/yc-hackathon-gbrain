export type SupabaseStorageConfig = {
  url: string;
  key: string;
  bucket: string;
};

export function getStorageConfig(): SupabaseStorageConfig {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  const bucket = process.env.SUPABASE_BUCKET ?? "recordings";
  if (!url) throw new Error("SUPABASE_URL is not set");
  if (!key) throw new Error("SUPABASE_ANON_KEY is not set");
  return { url, key, bucket };
}
