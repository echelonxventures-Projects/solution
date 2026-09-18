import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import authRoutes from './auth';
import { hashPassword } from '@consultancy/shared/auth';

const mocks = vi.hoisted(() => ({
  findOne: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  publishUserEvent: vi.fn(async () => {}),
}));

vi.mock('@consultancy/shared/database', () => ({
  findOne: mocks.findOne,
  findAll: vi.fn(async () => []),
  insert: mocks.insert,
  update: mocks.update,
  deleteOne: vi.fn(),
  softDelete: vi.fn(),
  DatabaseClient: { getInstance: vi.fn() },
}));

vi.mock('@consultancy/shared/events', () => ({
  publishUserEvent: mocks.publishUserEvent,
  publishConsultantEvent: vi.fn(async () => {}),
  publishBookingEvent: vi.fn(async () => {}),
  publishSessionEvent: vi.fn(async () => {}),
  publishPaymentEvent: vi.fn(async () => {}),
  EventBus: { getInstance: vi.fn() },
}));

describe('user-service /auth routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify();
    app.register(authRoutes, { prefix: '/auth' });
    app.setErrorHandler((error, _request, reply) => {
      const err = error as { statusCode?: number; code?: string };
      reply.code(err.statusCode || 500).send({ error: { code: err.code || 'INTERNAL_ERROR', message: error.message } });
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.publishUserEvent.mockResolvedValue(undefined as never);
  });

  describe('POST /auth/register', () => {
    const body = { email: 'new@user.com', password: 'Str0ngPass!', firstName: 'New', lastName: 'User' };

    it('creates a pending user and publishes user.created', async () => {
      mocks.findOne.mockResolvedValue(null);
      mocks.insert.mockResolvedValue({ id: 'u-1', email: body.email, status: 'pending' });

      const res = await app.inject({ method: 'POST', url: '/auth/register', payload: body });

      expect(res.statusCode).toBe(201);
      expect(res.json()).toEqual({ userId: 'u-1', email: body.email, status: 'pending', verificationRequired: true });
      const inserted = mocks.insert.mock.calls[0][1];
      expect(inserted.status).toBe('pending');
      expect(inserted.passwordHash).toMatch(/^\$2/);
      expect(mocks.publishUserEvent).toHaveBeenCalledWith('user.created', expect.objectContaining({ id: 'u-1' }), 'user-service');
    });

    it('returns 409 when email already registered', async () => {
      mocks.findOne.mockResolvedValue({ id: 'existing' });
      const res = await app.inject({ method: 'POST', url: '/auth/register', payload: body });
      expect(res.statusCode).toBe(409);
      expect(res.json().error.code).toBe('EMAIL_EXISTS');
    });

    it('returns 400 for invalid payload', async () => {
      const res = await app.inject({ method: 'POST', url: '/auth/register', payload: { email: 'bad', password: 'x' } });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    const passwordHash = Promise.resolve().then(() => hashPassword('Str0ngPass!'));

    const makeUser = (overrides: Record<string, unknown> = {}) => ({
      id: 'u-1',
      email: 'a@b.com',
      role: 'seeker',
      status: 'active',
      firstName: 'A',
      lastName: 'B',
      avatarUrl: 'https://cdn.test/a.png',
      twoFactorEnabled: false,
      passwordHash: undefined as string | undefined,
      ...overrides,
    });

    it('returns token pair on valid credentials', async () => {
      const user = makeUser({ passwordHash: await passwordHash });
      mocks.findOne.mockResolvedValue(user);
      mocks.update.mockResolvedValue(user);

      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'a@b.com', password: 'Str0ngPass!' },
      });

      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.accessToken).toBeTypeOf('string');
      expect(json.refreshToken).toBeTypeOf('string');
      expect(json.expiresIn).toBe(900);
      expect(json.user.id).toBe('u-1');
      expect(mocks.publishUserEvent).toHaveBeenCalledWith('user.logged_in', expect.objectContaining({ userId: 'u-1' }), 'user-service');
    });

    it('returns 401 for unknown email', async () => {
      mocks.findOne.mockResolvedValue(null);
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'ghost@b.com', password: 'whatever1' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 401 for wrong password', async () => {
      const user = makeUser({ passwordHash: await passwordHash });
      mocks.findOne.mockResolvedValue(user);
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'a@b.com', password: 'WrongPass123' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 401 for suspended accounts', async () => {
      const user = makeUser({ passwordHash: await passwordHash, status: 'suspended' });
      mocks.findOne.mockResolvedValue(user);
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'a@b.com', password: 'Str0ngPass!' },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('issues new tokens for a valid refresh token', async () => {
      const { generateRefreshToken } = await import('@consultancy/shared/auth');
      const refreshToken = generateRefreshToken({ userId: 'u-1', sessionId: 's-1', family: 'f-1' });
      mocks.findOne.mockResolvedValue({ id: 'u-1', email: 'a@b.com', role: 'seeker', status: 'active' });

      const res = await app.inject({ method: 'POST', url: '/auth/refresh', payload: { refreshToken } });

      expect(res.statusCode).toBe(200);
      expect(res.json().accessToken).toBeTypeOf('string');
    });

    it('returns 401 for invalid token', async () => {
      const res = await app.inject({ method: 'POST', url: '/auth/refresh', payload: { refreshToken: 'junk' } });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('responds 200 without leaking account existence', async () => {
      mocks.findOne.mockResolvedValue(null);
      const res = await app.inject({ method: 'POST', url: '/auth/forgot-password', payload: { email: 'nobody@b.com' } });
      expect(res.statusCode).toBe(200);
      expect(res.json().message).toBe('If email exists, reset link will be sent');
    });
  });
});
