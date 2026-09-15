/**
 * Where the backend lives, and one helper for talking to it.
 *
 * The frontend and the backend are separate deployments on separate origins.
 * Everything that used to be a database call inside a server action is now
 * an HTTP call to the backend, and the Socket.IO client connects straight to
 * it from the browser.
 *
 * Configuration:
 *   NEXT_PUBLIC_BACKEND_URL  required. The public URL of the backend, used by
 *                            the browser (Socket.IO) and, unless overridden,
 *                            by the server actions.
 *   BACKEND_URL              optional, server-only. Lets the server actions
 *                            reach the backend on a different (internal) URL.
 *   ADMIN_API_KEY            optional, server-only. Forwarded as `x-admin-key`
 *                            so the organiser routes accept the request in
 *                            production. Never exposed to the browser.
 */

const PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

function trimSlash(value: string) {
  return value.replace(/\/+$/, "");
}

/** The backend origin the browser should use (Socket.IO, direct fetches). */
export function getPublicBackendUrl() {
  return trimSlash(PUBLIC_BACKEND_URL);
}

/** The backend origin the server actions should use. */
export function getServerBackendUrl() {
  return trimSlash(process.env.BACKEND_URL || PUBLIC_BACKEND_URL);
}

export class BackendError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = "BackendError";
  }
}

type JsonBody = Record<string, unknown>;

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: JsonBody;
  /** Attach the organiser key. Only meaningful from the server. */
  organiser?: boolean;
};

/**
 * Call the backend from a server action and return its JSON body.
 *
 * The backend answers every route with JSON — 4xx included, where the body is
 * the same `{ status: "error", message }` report the UI already knows how to
 * show. Those are returned, not thrown; only a missing backend, a non-JSON
 * answer or a 5xx becomes a BackendError, so callers can turn it into the
 * "backend unreachable" message their page shows.
 */
export async function backendRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const base = getServerBackendUrl();
  if (!base) {
    throw new BackendError("NEXT_PUBLIC_BACKEND_URL is not set.", 0, null);
  }

  const headers: Record<string, string> = { accept: "application/json" };
  if (options.body !== undefined) headers["content-type"] = "application/json";
  if (options.organiser && process.env.ADMIN_API_KEY) {
    headers["x-admin-key"] = process.env.ADMIN_API_KEY;
  }

  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      // Every call here is a live read or a mutation; never serve it from a
      // cache Next might otherwise keep for a server-side fetch.
      cache: "no-store",
    });
  } catch (error) {
    throw new BackendError(
      `Could not reach the backend at ${base}: ${(error as Error).message}`,
      0,
      null,
    );
  }

  let body: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      throw new BackendError(`Backend returned non-JSON (${response.status}).`, response.status, text);
    }
  }

  if (response.status >= 500) {
    throw new BackendError(`Backend error ${response.status}.`, response.status, body);
  }

  return body as T;
}
