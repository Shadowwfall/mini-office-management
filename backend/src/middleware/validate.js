export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
      }));
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          details
        }
      });
    }

    if (source === 'body') {
      req.body = result.data;
    } else if (source === 'query') {
      req.validatedQuery = result.data;
      try {
        Object.assign(req.query, result.data);
      } catch {
        // In case req.query properties are read-only
      }
    } else if (source === 'params') {
      req.validatedParams = result.data;
      try {
        Object.assign(req.params, result.data);
      } catch {
        // In case req.params properties are read-only
      }
    }

    next();
  };
}
