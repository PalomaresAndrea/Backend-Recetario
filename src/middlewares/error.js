export function notFound(_req, res, _next) {
  res.status(404).json({ error: 'Not Found' });
}

export function errorHandler(err, _req, res, _next) {
  console.error('❌', err?.message, err?.stack);
  const code = err.status || 500;
  res.status(code).json({
    error: err.message || 'Server error',
    code
  });
}
