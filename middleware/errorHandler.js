const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(`Error: ${err.message}`, { stack: err.stack });

  if (err.name === 'CastError') {
    error.message = 'Resource not found';
    return res.status(404).json({ error: error.message });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `Duplicate value for field '${field}'`;
    return res.status(400).json({ error: error.message });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ error: 'Validation Error', details: messages });
  }

  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    return res.status(401).json({ error: error.message });
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    return res.status(401).json({ error: error.message });
  }

  res.status(err.statusCode || 500).json({
    error: error.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;
