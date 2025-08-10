export type RouteHandler = (req: Request, env: Env) => Promise<Response>;

const apiBase = (accountId: string) =>
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering`;

async function callBrowserRendering(
  endpoint: string,
  req: Request,
  env: Env,
): Promise<Response> {
  let payload: { url: string; headers?: Record<string, string>; waitForSelector?: string; selectors?: string[] } | any;
  try {
    payload = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (!payload?.url) {
    return new Response(
      JSON.stringify({ error: 'Missing "url" in request body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const cfResp = await fetch(`${apiBase(env.ACCOUNT_ID)}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.BROWSER_RENDERING_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  if (!cfResp.ok) {
    const text = await cfResp.text().catch(() => '');
    return new Response(
      JSON.stringify({
        error: 'Cloudflare Browser Rendering API request failed',
        status: cfResp.status,
        details: text,
      }),
      { status: cfResp.status, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return new Response(cfResp.body, cfResp);
}

export const routes = {
  '/content': (req: Request, env: Env) => callBrowserRendering('content', req, env),
  '/screenshot': (req: Request, env: Env) => callBrowserRendering('screenshot', req, env),
  '/pdf': (req: Request, env: Env) => callBrowserRendering('pdf', req, env),
  '/snapshot': (req: Request, env: Env) => callBrowserRendering('snapshot', req, env),
  '/scrape': (req: Request, env: Env) => callBrowserRendering('scrape', req, env),
  '/json': (req: Request, env: Env) => callBrowserRendering('json', req, env),
  '/links': (req: Request, env: Env) => callBrowserRendering('links', req, env),
  '/markdown': (req: Request, env: Env) => callBrowserRendering('markdown', req, env),
} satisfies Record<string, RouteHandler>;

export type RoutePath = keyof typeof routes;
