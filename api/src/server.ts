// Tekit Sushi dedicated backend (VPS-ready single app).
// Phase 1: skeleton + health with integration status. Order/menu logic is
// ported from web/api/*.js into routes/ in the next phase.
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './env.js';
import { integrationStatus } from './integrations/index.js';

const app = Fastify({ logger: true, trustProxy: true });
await app.register(cors, { origin: true });

app.get('/healthz', async () => ({
  ok: true,
  integrations: integrationStatus(),
}));

const start = async () => {
  try {
    await app.listen({ port: env.port, host: '0.0.0.0' });
  } catch (e) {
    app.log.error(e);
    process.exit(1);
  }
};
start();
