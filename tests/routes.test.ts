import { describe, it, expect, vi, afterEach } from 'vitest';
import handler from '../src/index';
import { routes } from '../src/browser-rendering';

interface Env {
  ACCOUNT_ID: string;
  BROWSER_RENDERING_TOKEN: string;
}

const env: Env = {
  ACCOUNT_ID: 'test',
  BROWSER_RENDERING_TOKEN: 'token',
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('browser-rendering routes', () => {
  it('requires url in body', async () => {
    const req = new Request('http://localhost/content', { method: 'POST', body: '{}' });
    const res = await routes['/content'](req, env);
    expect(res.status).toBe(400);
  });

  it('proxies request to Cloudflare API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('ok'));
    (globalThis as any).fetch = fetchMock;
    const req = new Request('http://localhost/screenshot', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
    });
    const res = await routes['/screenshot'](req, env);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
  });
});

describe('status route', () => {
  it('lists available routes', async () => {
    const req = new Request('http://localhost/status');
    const res = await handler.fetch(req as any, env as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.routes).toContain('/content');
  });
});
