import { Context, Next } from "hono";

export async function errorLoggerMiddleware(c: Context, next: Next) {
  await next();

  const status = c.res.status;

  if (status >= 400 && status < 500) {
    const method = c.req.method;
    const path = c.req.path;

    let responseBody = null;
    try {
      const response = c.res.clone();
      if (response.body) {
        const bodyText = await response.text();
        try {
          responseBody = JSON.parse(bodyText);
        } catch {
          responseBody = bodyText;
        }
      }
    } catch {}

    console.log(`Client Error:`, {
      status,
      method,
      path,
      responseBody,
      timestamp: new Date().toISOString(),
    });
  }
}
