import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({
  path: fileURLToPath(new URL('../../../../.env', import.meta.url)),
});
dotenv.config();

const pad = (value) => String(value).padStart(2, '0');

const formatDate = (date) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const valueByType = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return [
    valueByType.year,
    valueByType.month,
    valueByType.day,
    valueByType.hour,
    valueByType.minute,
    valueByType.second,
  ].join('');
};

const sortObject = (object) => {
  return Object.keys(object)
    .filter((key) => object[key] !== undefined && object[key] !== null && object[key] !== '')
    .sort()
    .reduce((result, key) => {
      result[key] = String(object[key]);
      return result;
    }, {});
};

const hmacSha512 = (secret, data) => {
  return crypto.createHmac('sha512', secret).update(Buffer.from(data, 'utf-8')).digest('hex');
};

const encodeVnpayValue = (value) => {
  return encodeURIComponent(String(value)).replace(/%20/g, '+');
};

const buildVnpayQuery = (params) => {
  return Object.keys(params)
    .map((key) => `${encodeVnpayValue(key)}=${encodeVnpayValue(params[key])}`)
    .join('&');
};

export const createVnpayPaymentUrl = ({
  paymentId,
  amount,
  orderInfo,
  ipAddress,
  bankCode,
  locale = 'vn',
}) => {
  const tmnCode = process.env.VNPAY_TMN_CODE;
  const hashSecret = process.env.VNPAY_HASH_SECRET;
  const paymentUrl = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  const returnUrl = process.env.VNPAY_RETURN_URL;

  if (!tmnCode || !hashSecret || !returnUrl) {
    throw new Error('VNPay configuration is incomplete');
  }

  const now = new Date();
  const expireAt = new Date(now.getTime() + Number(process.env.VNPAY_EXPIRE_MINUTES || 15) * 60 * 1000);
  const params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: locale,
    vnp_CurrCode: 'VND',
    vnp_TxnRef: paymentId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: Math.round(Number(amount) * 100),
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddress || '127.0.0.1',
    vnp_CreateDate: formatDate(now),
    vnp_ExpireDate: formatDate(expireAt),
  };

  if (bankCode) {
    params.vnp_BankCode = bankCode;
  }

  const sortedParams = sortObject(params);
  const signData = buildVnpayQuery(sortedParams);
  const secureHash = hmacSha512(hashSecret, signData);

  sortedParams.vnp_SecureHash = secureHash;

  return `${paymentUrl}?${buildVnpayQuery(sortedParams)}`;
};

export const verifyVnpayCallback = (input) => {
  const hashSecret = process.env.VNPAY_HASH_SECRET;

  if (!hashSecret) {
    throw new Error('VNPAY_HASH_SECRET is not configured');
  }

  const params = { ...input };
  const receivedHash = params.vnp_SecureHash;

  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  const sortedParams = sortObject(params);
  const signData = buildVnpayQuery(sortedParams);
  const expectedHash = hmacSha512(hashSecret, signData);

  return {
    isValid: receivedHash === expectedHash,
    expectedHash,
    receivedHash,
    params: sortedParams,
  };
};

export const isVnpaySuccess = (params) => {
  return params.vnp_ResponseCode === '00' && params.vnp_TransactionStatus === '00';
};
