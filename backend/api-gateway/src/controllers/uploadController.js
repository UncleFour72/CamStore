import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const uploadRoot = fileURLToPath(new URL('../../uploads/', import.meta.url));

const isPlaceholder = (value) => {
  return !value || /your|example|changeme|xxx|demo|cloud_name|api_key|api_secret/i.test(String(value));
};

const isLocalUploadEnabled = () => {
  if (process.env.ALLOW_LOCAL_UPLOADS !== undefined) {
    return process.env.ALLOW_LOCAL_UPLOADS !== 'false';
  }

  return process.env.NODE_ENV !== 'production';
};

const getCloudinaryConfig = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  return {
    cloudName,
    apiKey,
    apiSecret,
    isConfigured: ![cloudName, apiKey, apiSecret].some(isPlaceholder),
  };
};

const configureCloudinary = () => {
  const config = getCloudinaryConfig();

  if (!config.isConfigured) {
    return false;
  }

  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
  });

  return true;
};

const normalizeFolder = (value) => {
  const folder = String(value || 'camstore')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^\/+|\/+$/g, '');

  return folder || 'camstore';
};

const uploadBuffer = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result);
    });

    stream.end(buffer);
  });
};

const getExtension = (file) => {
  const originalExtension = path.extname(file.originalname || '').toLowerCase();

  if (/^\.[a-z0-9]{2,5}$/.test(originalExtension)) {
    return originalExtension;
  }

  const mimeMap = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
  };

  return mimeMap[file.mimetype] || '.jpg';
};

const buildPublicBaseUrl = (req) => {
  return process.env.PUBLIC_UPLOAD_BASE_URL || `${req.protocol}://${req.get('host')}`;
};

const uploadLocal = async (req, folder) => {
  const relativeFolder = normalizeFolder(folder);
  const destination = path.join(uploadRoot, relativeFolder);
  const filename = `${Date.now()}-${randomUUID()}${getExtension(req.file)}`;
  const filePath = path.join(destination, filename);

  await fs.mkdir(destination, { recursive: true });
  await fs.writeFile(filePath, req.file.buffer);

  const publicPath = `/uploads/${relativeFolder}/${filename}`.replace(/\\/g, '/');

  return {
    url: `${buildPublicBaseUrl(req)}${publicPath}`,
    public_id: `local/${relativeFolder}/${filename}`,
    width: null,
    height: null,
    format: getExtension(req.file).slice(1),
    bytes: req.file.size,
    storage: 'local',
  };
};

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    if (!String(req.file.mimetype || '').startsWith('image/')) {
      return res.status(400).json({ message: 'Only image uploads are supported' });
    }

    const folder = normalizeFolder(req.body.folder || req.query.folder);

    if (!configureCloudinary()) {
      if (!isLocalUploadEnabled()) {
        return res.status(503).json({
          message: 'Cloudinary is not configured. Please check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
        });
      }

      const localResult = await uploadLocal(req, folder);
      return res.status(201).json(localResult);
    }

    const result = await uploadBuffer(req.file.buffer, {
      folder,
      resource_type: 'image',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    });

    return res.status(201).json({
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (error) {
    return next(error);
  }
};
