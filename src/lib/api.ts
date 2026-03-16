type ApiEnvelope<T> = {
  ok?: boolean;
  message?: string;
  data?: T;
};

async function parseApiResponse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  let payload: ApiEnvelope<T> | null = null;

  if (raw) {
    try {
      payload = JSON.parse(raw) as ApiEnvelope<T>;
    } catch {
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }
      throw new Error('Server returned a non-JSON response');
    }
  }

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.message || `Request failed: ${response.status}`);
  }

  return (payload?.data as T) ?? (undefined as T);
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path);
  return parseApiResponse<T>(response);
}

export async function apiPost<T>(path: string): Promise<T> {
  const response = await fetch(path, { method: 'POST' });
  return parseApiResponse<T>(response);
}
