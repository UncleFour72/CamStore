import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { requestJson } from './http.js';

dotenv.config({
  path: fileURLToPath(new URL('../../../../.env', import.meta.url)),
});
dotenv.config();

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3008';

const internalHeaders = () => ({
  'x-internal-api-key': process.env.INTERNAL_API_KEY || '',
});

export const notifyUser = async ({
  userId,
  title,
  message,
  type = 'payment',
  entityType = 'payment',
  entityId,
  data,
  dedupeKey,
}) => {
  if (!userId) {
    return null;
  }

  try {
    return await requestJson(`${NOTIFICATION_SERVICE_URL}/api/notifications/internal`, {
      method: 'POST',
      headers: internalHeaders(),
      body: JSON.stringify({
        recipient_type: 'user',
        recipient_id: userId,
        title,
        message,
        type,
        entity_type: entityType,
        entity_id: entityId,
        data,
        dedupe_key: dedupeKey,
      }),
      timeoutMs: Number(process.env.NOTIFICATION_REQUEST_TIMEOUT_MS || 5000),
    });
  } catch (error) {
    console.warn('Payment notification dispatch failed:', error.message);
    return null;
  }
};
