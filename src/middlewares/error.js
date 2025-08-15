// src/middlewares/error.js
export function notFound(req, res, _next) {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
}

export function errorHandler(err, req, res, _next) {
  console.error('❌ ERROR:', {
    method: req.method,
    url: req.originalUrl,
    message: err?.message,
    name: err?.name,
    stack: err?.stack,
  });

  const code = err.status || 500;
  res.status(code).json({
    error: err.message || 'Server error',
    code
  });
}
