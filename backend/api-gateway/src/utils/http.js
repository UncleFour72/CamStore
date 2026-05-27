import { gatewayConfig } from '../config/services.js';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'expect',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

export class ServiceRequestError extends Error {
  constructor(message, statusCode = 502, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

const createAbortSignal = (timeoutMs = gatewayConfig.requestTimeoutMs) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return { signal: controller.signal, clear: () => clearTimeout(timeout) };
};

const appendQuery = (url, query = {}) => {
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url;
};

export const buildServiceUrl = (baseUrl, path, query = {}) => {
  const url = new URL(path, `${baseUrl}/`);
  return appendQuery(url, query);
};

const parseJsonOrText = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (!text) {
    return null;
  }

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  return text;
};

export const requestJson = async ({
  baseUrl,
  path,
  req,
  method = 'GET',
  query = {},
  body,
  headers = {},
  timeoutMs = gatewayConfig.requestTimeoutMs,
}) => {
  const url = buildServiceUrl(baseUrl, path, query);
  const { signal, clear } = createAbortSignal(timeoutMs);
  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  };

  if (req?.headers?.authorization) {
    requestHeaders.Authorization = req.headers.authorization;
  }

  const options = {
    method,
    headers: requestHeaders,
    signal,
  };

  if (body !== undefined && !['GET', 'HEAD'].includes(method.toUpperCase())) {
    requestHeaders['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await parseJsonOrText(response);

    if (!response.ok) {
      throw new ServiceRequestError(
        typeof data === 'object' && data?.message ? data.message : `Service request failed: ${response.status}`,
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ServiceRequestError(`Service request timeout: ${url.pathname}`, 504);
    }

    if (error instanceof ServiceRequestError) {
      throw error;
    }

    throw new ServiceRequestError(error.message || 'Service request failed', 502);
  } finally {
    clear();
  }
};

export const fetchAllPages = async ({
  baseUrl,
  path,
  dataKey,
  req,
  query = {},
  pageSize = gatewayConfig.aggregatePageSize,
  maxPages = gatewayConfig.aggregateMaxPages,
}) => {
  const items = [];
  let page = 1;

  while (page <= maxPages) {
    const data = await requestJson({
      baseUrl,
      path,
      req,
      query: {
        ...query,
        page,
        limit: pageSize,
      },
    });

    const rows = Array.isArray(data?.[dataKey]) ? data[dataKey] : [];
    items.push(...rows);

    const totalPages = Number(data?.pagination?.total_pages || 0);

    if (rows.length === 0 || page >= totalPages || totalPages === 0) {
      break;
    }

    page += 1;
  }

  return items;
};

const buildForwardHeaders = (req) => {
  const headers = {};

  for (const [key, value] of Object.entries(req.headers)) {
    const normalizedKey = key.toLowerCase();

    if (HOP_BY_HOP_HEADERS.has(normalizedKey)) {
      continue;
    }

    headers[key] = value;
  }

  headers['x-forwarded-host'] = req.headers.host || '';
  headers['x-forwarded-proto'] = req.protocol;
  headers['x-forwarded-for'] = req.ip;
  headers['x-forwarded-by'] = 'camstore-api-gateway';

  return headers;
};

const buildProxyBody = (req, headers) => {
  if (['GET', 'HEAD'].includes(req.method.toUpperCase())) {
    return undefined;
  }

  if (req.body === undefined) {
    return undefined;
  }

  if (Buffer.isBuffer(req.body) || typeof req.body === 'string') {
    return req.body;
  }

  headers['content-type'] = 'application/json';
  return JSON.stringify(req.body);
};

export const proxyRequest = async (req, res, next, baseUrl) => {
  const targetUrl = new URL(req.originalUrl, `${baseUrl}/`);
  const headers = buildForwardHeaders(req);
  const body = buildProxyBody(req, headers);
  const { signal, clear } = createAbortSignal();

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      signal,
    });
    const contentType = response.headers.get('content-type');
    const payload = Buffer.from(await response.arrayBuffer());

    if (contentType) {
      res.type(contentType);
    }

    return res.status(response.status).send(payload);
  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ message: 'Upstream service timeout' });
    }

    return next(error);
  } finally {
    clear();
  }
};
