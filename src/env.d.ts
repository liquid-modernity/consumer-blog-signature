/// <reference types="astro/client" />

import type { GagaRouteContext } from './gaga/content/runtime-route';

declare namespace App {
  interface Locals {
    gagaRoute: GagaRouteContext;
  }
}
