"use client";

export async function submitJsonMutation<TResponse>(
  input: string,
  body: Record<string, unknown>,
  init?: RequestInit
) {
  const response = await fetch(input, {
    method: "POST",
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    },
    body: JSON.stringify(body)
  });

  const payload = (await response.json()) as TResponse;

  if (!response.ok) {
    throw new Error(`Mutation failed for ${input}`);
  }

  return payload;
}
