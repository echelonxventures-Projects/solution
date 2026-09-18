import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ValidationError, NotFoundError, ConflictError } from '@consultancy/shared/utils/errors';
import { insert, findOne, findAll, update } from '@consultancy/shared/database';
import { Vertical } from '@consultancy/shared/types';
import { logger } from '@consultancy/shared';
import { initialVerticals } from '../config/initial-verticals.js';

const createVerticalSchema = z.object({
  code: z.string().min(2).max(50),
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  parentId: z.string().uuid().optional(),
  iconUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  colorCode: z.string().max(10).optional(),
  requiresVerification: z.boolean().default(false),
  verificationLevelReq: z.enum(['none', 'basic', 'verified', 'pro', 'enterprise']).default('none'),
  minExperienceYears: z.number().int().min(0).default(0),
  sessionTypesAllowed: z.array(z.enum(['video', 'audio', 'chat', 'in_person'])).default(['video', 'audio', 'chat']),
  pricingModelsAllowed: z.array(z.enum(['per_minute', 'per_hour', 'per_session', 'package'])).default(['per_minute', 'per_hour', 'per_session', 'package']),
});

const updateVerticalSchema = createVerticalSchema.partial();

const getVerticalsSchema = z.object({
  parentId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export default async function verticalsRoutes(server: FastifyInstance) {

  // GET /verticals - List verticals
  server.get<{ Querystring: z.infer<typeof getVerticalsSchema> }>(
    '/',
    {
      schema: {
        tags: ['verticals'],
        summary: 'List verticals',
        querystring: { type: 'object' },
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const { parentId, isActive, isFeatured, limit, offset } = request.query;

      let verticals = await findAll<Vertical>('verticals', {}, { limit, offset, order: 'sort_order ASC' });

      // Apply filters
      if (isActive !== undefined) verticals = verticals.filter(v => v.isActive === isActive);
      if (isFeatured !== undefined) verticals = verticals.filter(v => v.isFeatured === isFeatured);
      if (parentId) verticals = verticals.filter(v => v.parentId === parentId);

      reply.code(200).send({
        verticals: verticals.map(v => ({
          id: v.id,
          code: v.code,
          name: v.name,
          description: v.description,
          parentId: v.parentId,
          level: v.level,
          iconUrl: v.iconUrl,
          colorCode: v.colorCode,
          isActive: v.isActive,
          isFeatured: v.isFeatured,
          totalConsultants: v.totalConsultants,
          avgRating: v.avgRating,
        })),
        total: verticals.length,
        limit,
        offset,
      });
    }
  );

  // GET /verticals/:id - Get vertical details
  server.get<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['verticals'],
        summary: 'Get vertical details',
        params: { type: 'object', properties: { id: { type: 'string' } } },
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const vertical = await findOne<Vertical>('verticals', { id });
      if (!vertical) {
        throw new NotFoundError('Vertical', id);
      }

      // Get parent if exists
      const parent = vertical.parentId ? await findOne<Vertical>('verticals', { id: vertical.parentId }) : null;

      // Get children
      const children = await findAll<Vertical>('verticals', { parentId: id });

      reply.code(200).send({
        ...vertical,
        parent: parent ? { id: parent.id, name: parent.name, code: parent.code } : null,
        children: children.map(c => ({ id: c.id, name: c.name, code: c.code })),
      });
    }
  );

  // POST /verticals - Create vertical
  server.post<{ Body: z.infer<typeof createVerticalSchema> }>(
    '/',
    {
      schema: {
        tags: ['verticals'],
        summary: 'Create vertical',
        body: { type: 'object' },
        response: { 201: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const validation = createVerticalSchema.safeParse(request.body);
      if (!validation.success) {
        throw new ValidationError('Invalid vertical data', validation.error.errors);
      }

      const data = validation.data;

      // Check if code already exists
      const existing = await findOne<Vertical>('verticals', { code: data.code });
      if (existing) {
        throw new ConflictError('ALREADY_EXISTS', 'Vertical code already exists');
      }

      // Calculate level based on parent
      let level = 0;
      if (data.parentId) {
        const parent = await findOne<Vertical>('verticals', { id: data.parentId });
        if (!parent) {
          throw new NotFoundError('Parent vertical', data.parentId);
        }
        level = parent.level + 1;
      }

      const vertical = await insert<Vertical>('verticals', {
        code: data.code,
        name: data.name,
        nameTranslations: {},
        description: data.description || null,
        descriptionTranslations: {},
        parentId: data.parentId || null,
        level,
        iconUrl: data.iconUrl || null,
        bannerUrl: data.bannerUrl || null,
        colorCode: data.colorCode || null,
        isActive: true,
        isFeatured: false,
        sortOrder: 0,
        requiresVerification: data.requiresVerification,
        verificationLevelReq: data.verificationLevelReq,
        minExperienceYears: data.minExperienceYears,
        requiredCertifications: [],
        sessionTypesAllowed: data.sessionTypesAllowed,
        pricingModelsAllowed: data.pricingModelsAllowed,
        defaultPricing: {},
        complianceRequirements: {},
        aiMatchingConfig: {},
        domainKnowledgeBase: false,
        aiPromptTemplates: {},
        specializedEntities: [],
        totalConsultants: 0,
        activeConsultants: 0,
        totalSessions: 0,
        totalRevenue: 0,
        avgRating: 0,
        popularityScore: 0,
      });

      logger.info('Vertical created', { verticalId: vertical.id, code: data.code });

      reply.code(201).send(vertical);
    }
  );

  // PUT /verticals/:id - Update vertical
  server.put<{ Params: { id: string }; Body: z.infer<typeof updateVerticalSchema> }>(
    '/:id',
    {
      schema: {
        tags: ['verticals'],
        summary: 'Update vertical',
        params: { type: 'object', properties: { id: { type: 'string' } } },
        body: { type: 'object' },
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const validation = updateVerticalSchema.safeParse(request.body);
      if (!validation.success) {
        throw new ValidationError('Invalid update data', validation.error.errors);
      }

      const vertical = await findOne<Vertical>('verticals', { id });
      if (!vertical) {
        throw new NotFoundError('Vertical', id);
      }

      const updated = await update<Vertical>('verticals', id, validation.data);

      logger.info('Vertical updated', { verticalId: id });

      reply.code(200).send(updated);
    }
  );

  // DELETE /verticals/:id - Soft delete vertical
  server.delete<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['verticals'],
        summary: 'Delete vertical',
        params: { type: 'object', properties: { id: { type: 'string' } } },
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const vertical = await findOne<Vertical>('verticals', { id });
      if (!vertical) {
        throw new NotFoundError('Vertical', id);
      }

      // Check for children
      const children = await findAll<Vertical>('verticals', { parentId: id });
      if (children.length > 0) {
        throw new ConflictError('HAS_CHILDREN', 'Cannot delete vertical with children');
      }

      await update<Vertical>('verticals', id, { isActive: false });

      logger.info('Vertical deleted', { verticalId: id });

      reply.code(200).send({ message: 'Vertical deleted' });
    }
  );

  // GET /verticals/code/:code - Get vertical by code
  server.get<{ Params: { code: string } }>(
    '/code/:code',
    {
      schema: {
        tags: ['verticals'],
        summary: 'Get vertical by code',
        params: { type: 'object', properties: { code: { type: 'string' } } },
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const { code } = request.params;

      const vertical = await findOne<Vertical>('verticals', { code });
      if (!vertical) {
        throw new NotFoundError('Vertical', code);
      }

      reply.code(200).send(vertical);
    }
  );

  // POST /verticals/seed - Seed initial verticals
  server.post(
    '/seed',
    {
      schema: {
        tags: ['verticals'],
        summary: 'Seed initial verticals',
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const created = [];

      for (const v of initialVerticals) {
        const existing = await findOne<Vertical>('verticals', { code: v.code });
        if (!existing) {
          const vertical = await insert<Vertical>('verticals', v);
          created.push(vertical);
        }
      }

      logger.info('Verticals seeded', { count: created.length });

      reply.code(200).send({
        message: 'Verticals seeded',
        created: created.length,
        verticals: created.map(v => ({ id: v.id, code: v.code, name: v.name })),
      });
    }
  );
}