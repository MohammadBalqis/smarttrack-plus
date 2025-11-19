// src/middleware/validateMiddleware.js
import Joi from "joi";

export const validate = (schema) => (req, res, next) => {
  const data = {
    body: req.body,
    query: req.query,
    params: req.params,
  };

  const { error, value } = schema.validate(data, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      ok: false,
      error: "Validation error",
      details: error.details.map((d) => d.message),
    });
  }

  // if you want cleaned values:
  req.body = value.body;
  req.query = value.query;
  req.params = value.params;

  next();
};
