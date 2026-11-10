// Never reflect arbitrary exception text, provider responses or input to clients.
export function publicFailure(error) {
  const message = error instanceof Error ? error.message : "";
  if (message === "Rate limit exceeded.")
    return { status: 429, error: "Too many requests. Please try again later." };
  if (message === "Security services unavailable.")
    return { status: 503, error: "This service is temporarily unavailable." };
  if (message === "Sign in required.")
    return { status: 401, error: "Sign in required." };
  if (message === "Admin access required.")
    return {
      status: 403,
      error: "You do not have permission for this action.",
    };
  if (message === "Request too large.")
    return { status: 413, error: "Request too large." };
  return {
    status: 400,
    error: "Could not complete the request. Check your entries and try again.",
  };
}

// Bound bytes while reading, before parsing JSON or buffering the whole request.
export async function readJsonObject(request, maxBytes) {
  const declared = request.headers.get("content-length");
  if (declared && Number(declared) > maxBytes)
    throw Error("Request too large.");
  if (!request.body) throw Error("Invalid request.");
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw Error("Request too large.");
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    const data = JSON.parse(text);
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw Error("Invalid request.");
    return data;
  } finally {
    reader.releaseLock();
  }
}

export function validatedReflection(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).length !== 1 ||
    typeof value.reflection !== "string"
  )
    throw Error("Invalid reflection.");
  const reflection = value.reflection.trim();
  if (
    reflection.length < 10 ||
    reflection.length > 2500 ||
    reflection.split(/\s+/u).length > 150
  )
    throw Error("Invalid reflection.");
  return reflection;
}
