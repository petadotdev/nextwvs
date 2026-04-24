import { headers } from "next/headers";

export async function createServerFetchHeaders() {
  const headerStore = await headers();

  return {
    "x-request-id":
      headerStore.get("x-request-id") ??
      `req_${Math.random().toString(36).slice(2, 10)}`,
    accept: "application/json"
  };
}

export async function serverFetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      ...(await createServerFetchHeaders()),
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  const payload = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`Server fetch failed for ${input}`);
  }

  return payload;
}
