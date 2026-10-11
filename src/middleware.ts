import { defineMiddleware } from 'astro:middleware';
import { resolveGagaRoute } from './gaga/content/resolve-route';

export const onRequest = defineMiddleware(
  async ({ locals, request }, next) => {
    locals.gagaRoute = await resolveGagaRoute(
      new URL(request.url).pathname
    );

    return next();
  }
);
