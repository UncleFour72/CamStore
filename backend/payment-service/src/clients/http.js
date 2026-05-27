const DEFAULT_TIMEOUT_MS = Number(process.env.INTERNAL_REQUEST_TIMEOUT_MS || 8000);

export const requestJson = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    });

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : null;

    if (!response.ok) {
      const error = new Error(data?.message || `HTTP ${response.status}`);
      error.statusCode = response.status;
      error.response = data;
      throw error;
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
};
