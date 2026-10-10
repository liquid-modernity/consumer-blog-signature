import type { APIRoute } from 'astro';
export const GET: APIRoute = () => new Response(JSON.stringify({
  name: 'consumer-blog-signature', version: '0.0.1', gagaEngine: '0.1.6',
  commit: import.meta.env.PUBLIC_GIT_SHA || 'local', builtAt: import.meta.env.PUBLIC_BUILD_TIME || 'unknown'
}, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
