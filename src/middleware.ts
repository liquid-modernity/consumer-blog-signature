import { defineMiddleware } from 'astro:middleware';
import { normalizeGagaRouteContext } from './gaga/content/runtime-route';

export const onRequest = defineMiddleware(
  async ({ locals }, next) => {
    locals.gagaRoute = normalizeGagaRouteContext({
      id: '',
      lang: 'id',
      entry: {
        data: {}
      },
      toc: {
        items: []
      },
      head: []
    });

    return next();
  }
);
