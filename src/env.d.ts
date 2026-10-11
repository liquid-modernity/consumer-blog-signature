/// <reference types="astro/client" />

import type { GagaRouteContext } from './gaga/content/runtime-route';

declare global {
  namespace App {
    interface Locals {
      gagaRoute: GagaRouteContext;
    }
  }
}

export {};
