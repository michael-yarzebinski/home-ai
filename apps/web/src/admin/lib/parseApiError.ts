/**
 * Best-effort message from Nest / fetch error bodies (JSON or plain text).
 */
export async function parseApiError(res: Response): Promise<string> {
  const text = await res.text();
  if (!text) {
    return res.statusText || `Request failed (${res.status})`;
  }
  try {
    const j = JSON.parse(text) as { message?: string | string[] };
    if (typeof j.message === 'string') {
      return j.message;
    }
    if (Array.isArray(j.message)) {
      return j.message.join('; ');
    }
  } catch {
    /* not JSON */
  }
  return text;
}
