import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({
  path: fileURLToPath(new URL('../../../../.env', import.meta.url)),
});
dotenv.config();

const hmacSha256 = (secret, data) => {
  return crypto.createHmac('sha256', secret).update(data, 'utf-8').digest('hex');
};

const encodeExtraData = (payload = {}) => {
  if (typeof payload === 'string') {
    return payload;
  }

  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

export const createMomoPaymentRequest = ({
  paymentId,
  amount,
  orderInfo,
  extraData = {},
  requestType = 'captureWallet',
}) => {
  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;
  const endpoint = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';
  const redirectUrl = process.env.MOMO_RETURN_URL;
  const ipnUrl = process.env.MOMO_IPN_URL;

  if (!partnerCode || !accessKey || !secretKey || !redirectUrl || !ipnUrl) {
    throw new Error('MoMo configuration is incomplete');
  }

  const requestId = `${paymentId}-${Date.now()}`;
  const orderId = String(paymentId);
  const normalizedAmount = String(Math.round(Number(amount)));
  const normalizedExtraData = encodeExtraData(extraData);
  const rawSignature = [
    `accessKey=${accessKey}`,
    `amount=${normalizedAmount}`,
    `extraData=${normalizedExtraData}`,
    `ipnUrl=${ipnUrl}`,
    `orderId=${orderId}`,
    `orderInfo=${orderInfo}`,
    `partnerCode=${partnerCode}`,
    `redirectUrl=${redirectUrl}`,
    `requestId=${requestId}`,
    `requestType=${requestType}`,
  ].join('&');
  const signature = hmacSha256(secretKey, rawSignature);

  return {
    endpoint,
    body: {
      partnerCode,
      partnerName: process.env.MOMO_PARTNER_NAME || 'CamStore',
      storeId: process.env.MOMO_STORE_ID || 'CamStore',
      requestId,
      amount: normalizedAmount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang: 'vi',
      requestType,
      autoCapture: true,
      extraData: normalizedExtraData,
      signature,
    },
  };
};

export const verifyMomoCallback = (payload) => {
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;

  if (!accessKey || !secretKey) {
    throw new Error('MoMo signature configuration is incomplete');
  }

  const rawSignature = [
    `accessKey=${accessKey}`,
    `amount=${payload.amount ?? ''}`,
    `extraData=${payload.extraData ?? ''}`,
    `message=${payload.message ?? ''}`,
    `orderId=${payload.orderId ?? ''}`,
    `orderInfo=${payload.orderInfo ?? ''}`,
    `orderType=${payload.orderType ?? ''}`,
    `partnerCode=${payload.partnerCode ?? ''}`,
    `payType=${payload.payType ?? ''}`,
    `requestId=${payload.requestId ?? ''}`,
    `responseTime=${payload.responseTime ?? ''}`,
    `resultCode=${payload.resultCode ?? ''}`,
    `transId=${payload.transId ?? ''}`,
  ].join('&');
  const expectedSignature = hmacSha256(secretKey, rawSignature);

  return {
    isValid: payload.signature === expectedSignature,
    expectedSignature,
    receivedSignature: payload.signature,
    rawSignature,
  };
};

export const isMomoSuccess = (payload) => {
  return Number(payload.resultCode) === 0;
};
