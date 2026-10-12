import type { APIRoute } from 'astro';
import { buildMachineIndex } from '../lib/discovery';

export const prerender = true;

export const GET: APIRoute = async () => new Response(
  JSON.stringify(await buildMachineIndex()),
  { headers: { 'content-type': 'application/json; charset=utf-8' } }
);
