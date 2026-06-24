function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      // zod v4: .issues / zod v3: .errors (alias for .issues)
      const issues = result.error?.issues ?? result.error?.errors ?? [];
      const message = issues[0]?.message ?? '입력값이 올바르지 않습니다.';
      return res.status(400).json({ error: message });
    }
    req.body = result.data;
    next();
  };
}

module.exports = validate;
