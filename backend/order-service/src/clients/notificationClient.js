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

const sendNotification = async (payload) => {
  try {
    return await requestJson(`${NOTIFICATION_SERVICE_URL}/api/notifications/internal`, {
      method: 'POST',
      headers: internalHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: Number(process.env.NOTIFICATION_REQUEST_TIMEOUT_MS || 5000),
    });
  } catch (error) {
    console.warn('Notification dispatch failed:', error.message);
    return null;
  }
};

export const notifyAdmin = async ({ title, message, type = 'system', entityType, entityId, data, dedupeKey }) => {
  return sendNotification({
    recipient_type: 'admin',
    title,
    message,
    type,
    entity_type: entityType,
    entity_id: entityId,
    data,
    dedupe_key: dedupeKey,
  });
};

export const notifyUser = async ({
  userId,
  title,
  message,
  type = 'system',
  entityType,
  entityId,
  data,
  dedupeKey,
}) => {
  if (!userId) {
    return null;
  }

  return sendNotification({
    recipient_type: 'user',
    recipient_id: userId,
    title,
    message,
    type,
    entity_type: entityType,
    entity_id: entityId,
    data,
    dedupe_key: dedupeKey,
  });
};
