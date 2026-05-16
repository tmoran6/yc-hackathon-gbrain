import { getStorageConfig } from "./supabase";

export type StorageObject = {
  name: string;
  id: string | null;
  updated_at: string | null;
  created_at: string | null;
  last_accessed_at: string | null;
  metadata: { size?: number; mimetype?: string } | null;
};

export async function listObjects(prefix: string): Promise<StorageObject[]> {
  const { url, key, bucket } = getStorageConfig();
  const res = await fetch(`${url}/storage/v1/object/list/${bucket}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prefix,
      limit: 1000,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      `Storage list failed: ${res.status} ${await res.text().catch(() => "")}`,
    );
  }
  return (await res.json()) as StorageObject[];
}

export function publicUrl(path: string): string {
  const { url, bucket } = getStorageConfig();
  return `${url}/storage/v1/object/public/${bucket}/${encodePath(path)}`;
}

export async function fetchObjectText(path: string): Promise<string> {
  const { url, key, bucket } = getStorageConfig();
  const res = await fetch(
    `${url}/storage/v1/object/${bucket}/${encodePath(path)}`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    },
  );
  if (!res.ok) return "";
  return await res.text();
}

function encodePath(path: string): string {
  return path
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}
