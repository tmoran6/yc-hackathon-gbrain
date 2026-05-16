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

export async function deleteObjects(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { url, key, bucket } = getStorageConfig();
  const res = await fetch(`${url}/storage/v1/object/${bucket}`, {
    method: "DELETE",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefixes: paths }),
  });
  if (!res.ok) {
    throw new Error(
      `Storage delete failed: ${res.status} ${await res.text().catch(() => "")}`,
    );
  }
}

// Remove every object under <sessionId>/ (screenshots + transcripts).
// Returns how many objects were deleted.
export async function deleteSessionObjects(
  sessionId: string,
): Promise<number> {
  const prefixes = [
    `${sessionId}/screenshots/`,
    `${sessionId}/transcripts/`,
  ];
  const paths: string[] = [];
  for (const prefix of prefixes) {
    const objs = await listObjects(prefix).catch(() => []);
    for (const o of objs) {
      if (o.name && !o.name.endsWith("/")) paths.push(`${prefix}${o.name}`);
    }
  }
  await deleteObjects(paths);
  return paths.length;
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
