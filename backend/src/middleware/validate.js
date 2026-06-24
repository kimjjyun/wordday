const { ZodError } = require('zod');

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const first = result.error.errors[0];
      return res.status(400).json({ error: first.message });
    }
    req.body = result.data;
    next();
  };
}

module.exports = validate;
