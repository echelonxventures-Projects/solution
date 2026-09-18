import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from './index';

// Prevent outbound calls to the WhatsApp Graph API during tests
const fetchMock = vi.fn().mockResolvedValue({
  json: async () => ({ success: true }),
});
vi.stubGlobal('fetch', fetchMock);

describe('whatsapp-bot', () => {
  afterAll(async () => {
    vi.unstubAllGlobals();
  });

  describe('GET /health', () => {
    it('returns ok status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('GET /webhook (verification)', () => {
    it('verifies when mode and token match', async () => {
      const res = await request(app).get(
        '/webhook?hub.mode=subscribe&hub.verify_token=consultancy_verify_token&hub.challenge=challenge123'
      );
      expect(res.status).toBe(200);
      expect(res.text).toBe('challenge123');
    });

    it('rejects verification with wrong token', async () => {
      const res = await request(app).get(
        '/webhook?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=challenge123'
      );
      expect(res.status).toBe(403);
    });

    it('rejects verification with wrong mode', async () => {
      const res = await request(app).get(
        '/webhook?hub.mode=other&hub.verify_token=consultancy_verify_token&hub.challenge=challenge123'
      );
      expect(res.status).toBe(403);
    });
  });

  describe('POST /webhook (message handling)', () => {
    beforeAll(() => {
      fetchMock.mockClear();
    });

    it('rejects malformed payloads', async () => {
      const res = await request(app).post('/webhook').send({ notEntry: true });
      expect(res.status).toBe(400);
    });

    it('acknowledges a valid text message and echoes OK', async () => {
      const res = await request(app).post('/webhook').send({
        entry: [
          {
            changes: [
              {
                value: {
                  metadata: { phone_number_id: '123456' },
                  messages: [
                    {
                      from: '15550001111',
                      id: 'msg_1',
                      timestamp: '1700000000',
                      type: 'text',
                      text: { body: 'book a session' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      });

      expect(res.status).toBe(200);
      expect(res.text).toBe('OK');
      // markMessageAsRead + outbound reply should hit the Graph API
      expect(fetchMock).toHaveBeenCalled();
    });

    it('acknowledges messages without a messages array', async () => {
      const res = await request(app).post('/webhook').send({
        entry: [{ changes: [{ value: { metadata: { phone_number_id: '123456' } } }] }],
      });
      expect(res.status).toBe(200);
    });
  });
});
