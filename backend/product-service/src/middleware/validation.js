export const validateRequiredFields = (fields) => (req, res, next) => {
  const missing = fields.filter((field) => {
    const value = req.body?.[field];
    return value === undefined || value === null || String(value).trim() === '';
  });

  if (missing.length > 0) {
    return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
  }

  return next();
};

export const validatePositiveId = (paramName = 'id') => (req, res, next) => {
  const value = Number.parseInt(req.params[paramName], 10);

  if (!Number.isInteger(value) || value <= 0) {
    return res.status(400).json({ message: `${paramName} must be a positive integer` });
  }

  return next();
};
