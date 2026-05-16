// Create the Supabase Storage bucket used for screenshots + transcripts.
// Idempotent: if the bucket already exists we just log and exit.

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;
const bucket = process.env.SUPABASE_BUCKET ?? "recordings";

if (!url) {
  console.error("SUPABASE_URL is not set. Did you create .env.local?");
  process.exit(1);
}
if (!key) {
  console.error("SUPABASE_ANON_KEY is not set. Did you create .env.local?");
  process.exit(1);
}

const res = await fetch(`${url}/storage/v1/bucket`, {
  method: "POST",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ id: bucket, name: bucket, public: true }),
});

if (res.ok) {
  console.log(`Created public bucket "${bucket}".`);
  process.exit(0);
}

const body = await res.text();
if (res.status === 409 || /already exists/i.test(body)) {
  console.log(`Bucket "${bucket}" already exists.`);
  process.exit(0);
}
console.error(`Failed to create bucket: ${res.status} ${body}`);
process.exit(1);
