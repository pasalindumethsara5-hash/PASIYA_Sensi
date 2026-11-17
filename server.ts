import crypto from 'node:crypto';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { BUILTIN_CONFIGS, type SensitivityConfig } from './src/lib/optimizer.ts';
import {
  canonicalPayload,
  computeSha256Hex,
  validateConfigBounds,
} from './src/lib/security.ts';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 3000);

// Server-only HMAC-SHA256 secret (never exposed to browser clients)
const SIGNING_SECRET =
  process.env.PRESET_SIGNING_KEY &&
  process.env.PRESET_SIGNING_KEY !== 'CHANGE_THIS_TO_A_STRONG_RANDOM_SECRET'
    ? process.env.PRESET_SIGNING_KEY
    : crypto.randomBytes(32).toString('hex');

function signCanonical(payload: string): string {
  return crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(payload)
    .digest('hex');
}

function timingSafeHexEqual(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0 || a.length % 2 !== 0) {
    return false;
  }
  try {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

// In-memory rate limiter: 60 requests / minute per IP on /api/*
const rateWindowMs = 60_000;
const rateLimitMax = 60;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function apiRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const isSpeedTest = req.path.startsWith('/speedtest');
  const maxAllowed = isSpeedTest ? 240 : rateLimitMax;
  const bucketKey = `${req.ip || req.socket.remoteAddress || 'local'}:${isSpeedTest ? 'net' : 'cfg'}`;
  const now = Date.now();
  const entry = rateBuckets.get(bucketKey);

  if (!entry || now > entry.resetAt) {
    rateBuckets.set(bucketKey, { count: 1, resetAt: now + rateWindowMs });
    res.setHeader('X-RateLimit-Remaining', String(maxAllowed - 1));
    next();
    return;
  }

  if (entry.count >= maxAllowed) {
    res.status(429).json({
      error: `Rate limit exceeded (${maxAllowed} requests/min). Wait a moment and retry.`,
    });
    return;
  }

  entry.count += 1;
  res.setHeader('X-RateLimit-Remaining', String(maxAllowed - entry.count));
  next();
}

const SPEEDTEST_SEED_CHUNK = crypto.randomBytes(65_536);

async function signConfig(config: SensitivityConfig): Promise<SensitivityConfig> {
  const payload = canonicalPayload(config);
  const checksum = await computeSha256Hex(payload);
  const signature = signCanonical(payload);
  return {
    ...config,
    checksum,
    signature,
  };
}

async function startServer(): Promise<void> {
  const app = express();
  app.disable('x-powered-by');

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.use('/api', apiRateLimiter);

  // Speed test binary upload endpoint (parsed raw before express.json)
  app.post(
    '/api/speedtest/upload',
    express.raw({ type: '*/*', limit: '6mb' }),
    (req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      const receivedBytes = Buffer.isBuffer(req.body) ? req.body.length : 0;
      res.json({ receivedBytes, serverTime: Date.now() });
    }
  );

  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, mode: 'hmac-sha256-guarded', timestamp: Date.now() });
  });

  app.get('/api/speedtest/ping', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json({ ok: true, serverTime: Date.now() });
  });

  const probeTcpTarget = (
    host: string,
    port: number,
    timeoutMs = 1500
  ): Promise<number | null> =>
    new Promise((resolve) => {
      const start = performance.now();
      const socket = new net.Socket();
      let settled = false;
      const done = (ms: number | null) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        resolve(ms);
      };
      socket.setTimeout(timeoutMs);
      socket.once('connect', () => {
        done(Math.max(1, Math.round(performance.now() - start)));
      });
      socket.once('timeout', () => done(null));
      socket.once('error', () => done(null));
      socket.connect(port, host);
    });

  app.get('/api/tools/dns-benchmark', async (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const targets = [
      { id: 'cf-dns', label: 'Cloudflare Gaming DNS', endpoint: '1.1.1.1:443', host: '1.1.1.1', port: 443 },
      { id: 'google-dns', label: 'Google Public DNS', endpoint: '8.8.8.8:443', host: '8.8.8.8', port: 443 },
      { id: 'quad9-dns', label: 'Quad9 Low-Ping DNS', endpoint: '9.9.9.9:443', host: '9.9.9.9', port: 443 },
      { id: 'adguard-dns', label: 'AdGuard DNS Edge', endpoint: '94.140.14.14:443', host: '94.140.14.14', port: 443 },
    ];
    const items = await Promise.all(
      targets.map(async (t) => {
        const latencyMs = await probeTcpTarget(t.host, t.port, 1400);
        return {
          id: t.id,
          label: t.label,
          endpoint: t.endpoint,
          latencyMs,
          status: latencyMs !== null ? 'online' : 'unreachable',
        };
      })
    );
    res.json({ items, measuredAt: Date.now() });
  });

  app.get('/api/tools/region-ping', async (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const regions = [
      { id: 'sg', label: 'Singapore (SG · Asia East)', endpoint: 'cloudflare-dns.com', host: '1.1.1.1', port: 443 },
      { id: 'in-mum', label: 'Mumbai (IND · South Asia)', endpoint: 'dns.google', host: '8.8.4.4', port: 443 },
      { id: 'jp-tok', label: 'Tokyo (JP · Asia North)', endpoint: 'one.one.one.one', host: '1.0.0.1', port: 443 },
      { id: 'eu-fra', label: 'Frankfurt (EU · Central)', endpoint: 'quad9.net', host: '9.9.9.9', port: 443 },
      { id: 'us-east', label: 'Virginia (NA · US East)', endpoint: 'opendns.com', host: '208.67.222.222', port: 443 },
    ];
    const items = await Promise.all(
      regions.map(async (r) => {
        const latencyMs = await probeTcpTarget(r.host, r.port, 1400);
        return {
          id: r.id,
          label: r.label,
          endpoint: r.endpoint,
          latencyMs,
          status: latencyMs !== null ? 'online' : 'unreachable',
        };
      })
    );
    res.json({ items, measuredAt: Date.now() });
  });

  app.get('/api/speedtest/download', (req, res) => {
    const requested = Number(req.query.bytes);
    const totalBytes = Number.isFinite(requested)
      ? Math.min(4_194_304, Math.max(65_536, Math.floor(requested)))
      : 1_048_576;

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', String(totalBytes));
    res.setHeader('Content-Encoding', 'identity');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    let remaining = totalBytes;
    while (remaining > 0) {
      const size = Math.min(remaining, SPEEDTEST_SEED_CHUNK.length);
      res.write(SPEEDTEST_SEED_CHUNK.subarray(0, size));
      remaining -= size;
    }
    res.end();
  });

  app.get('/api/presets', async (_req, res) => {
    const signed = await Promise.all(BUILTIN_CONFIGS.map(signConfig));
    res.json({
      items: signed,
      algorithm: 'HMAC-SHA256',
      issuedAt: new Date().toISOString(),
    });
  });

  app.post('/api/sign-config', async (req, res) => {
    const candidate = req.body?.config;
    if (!validateConfigBounds(candidate)) {
      res.status(400).json({
        error: 'Invalid or out-of-bounds sensitivity configuration rejected.',
      });
      return;
    }
    const signed = await signConfig({
      ...candidate,
      source: candidate.source ?? 'custom',
    });
    res.json({
      config: signed,
      algorithm: 'HMAC-SHA256',
    });
  });

  app.post('/api/verify-config', async (req, res) => {
    const candidate = req.body?.config;
    const signature = req.body?.signature;
    const checksum = req.body?.checksum;

    if (!validateConfigBounds(candidate)) {
      res.status(400).json({
        valid: false,
        reason: 'Out-of-bounds or malformed config values rejected by schema guard.',
      });
      return;
    }

    const payload = canonicalPayload(candidate);
    const computedChecksum = await computeSha256Hex(payload);

    if (typeof checksum === 'string' && checksum !== computedChecksum) {
      res.json({
        valid: false,
        hmacValid: false,
        checksumValid: false,
        computedChecksum,
        reason: 'Payload SHA-256 checksum mismatch — config was modified.',
      });
      return;
    }

    if (typeof signature !== 'string' || !signature) {
      res.json({
        valid: false,
        hmacValid: false,
        checksumValid: true,
        computedChecksum,
        reason: 'Missing server HMAC-SHA256 signature.',
      });
      return;
    }

    const expectedSig = signCanonical(payload);
    const hmacValid = timingSafeHexEqual(signature, expectedSig);

    res.json({
      valid: hmacValid,
      hmacValid,
      checksumValid: true,
      computedChecksum,
      reason: hmacValid
        ? 'Server HMAC-SHA256 signature & SHA-256 checksum verified.'
        : 'HMAC-SHA256 signature mismatch — config was altered or signed with an untrusted key.',
    });
  });

  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
        watch: null,
      },
      appType: 'spa',
    });

    app.get('/@vite/client', async (_req, res, next) => {
      try {
        const result = await vite.transformRequest('/@vite/client');
        if (!result) {
          next();
          return;
        }
        const patched = result.code
          .replace('const socket = options.createConnection();', 'return;')
          .replace('ws.send(JSON.stringify(data));', 'ws?.send(JSON.stringify(data));');
        res.type('application/javascript').send(patched);
      } catch {
        next();
      }
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`PASIYA SENSI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
