import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  ValidationError, NotFoundError, ConflictError
} from '@consultancy/shared/utils/errors';
import {
  insert, findOne, findAll, update
} from '@consultancy/shared/database';
import { publishConsultantEvent } from '@consultancy/shared/events';
import { Consultant, ConsultantStatus, User, UserRole } from '@consultancy/shared/types';
import { logger } from '@consultancy/shared';

// ===== SCHEMAS =====

const registerConsultantSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(2).max(100),
  professionalBio: z.string().min(50).max(2000),
  yearsOfExperience: z.number().int().min(0).max(50),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    field: z.string(),
    year: z.number().int(),
  })).optional(),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    year: z.number().int(),
  })).optional(),
  languagesSpoken: z.array(z.string()).min(1),
  specializations: z.array(z.string()).min(1),
  verticalIds: z.array(z.string().uuid()).min(1),
  serviceTypes: z.array(z.enum(['video', 'audio', 'chat', 'in_person'])).min(1),
  pricingModel: z.enum(['per_minute', 'per_hour', 'per_session', 'package']),
  baseRate: z.number().positive().max(10000),
  weeklySchedule: z.object({
    monday: z.any().optional(),
    tuesday: z.any().optional(),
    wednesday: z.any().optional(),
    thursday: z.any().optional(),
    friday: z.any().optional(),
    saturday: z.any().optional(),
    sunday: z.any().optional(),
  }),
});

const updateConsultantSchema = registerConsultantSchema.partial().omit({ userId: true });

const searchConsultantsSchema = z.object({
  vertical: z.string().optional(),
  specialization: z.string().optional(),
  language: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  maxPrice: z.coerce.number().positive().optional(),
  availability: z.coerce.boolean().optional(),
  sort: z.enum(['rating', 'price', 'popularity', 'experience']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// ===== ROUTES =====

export default async function consultantsRoutes(server: FastifyInstance) {

  // POST /consultants - Register as consultant
  server.post<{ Body: z.infer<typeof registerConsultantSchema> }>(
    '/',
    {
      schema: {
        tags: ['consultants'],
        summary: 'Register as consultant',
        body: { type: 'object' },
        response: { 201: { type: 'object', properties: { id: { type: 'string' }, status: { type: 'string' } } } },
      },
    },
    async (request, reply) => {
      const validation = registerConsultantSchema.safeParse(request.body);
      if (!validation.success) {
        throw new ValidationError('Invalid consultant data', validation.error.errors);
      }

      const data = validation.data;

      // Check if user exists and is not already a consultant
      const existingUser = await findOne<User>('users', { id: data.userId });
      if (!existingUser) {
        throw new NotFoundError('User', data.userId);
      }

      const existingConsultant = await findOne<Consultant>('consultants', { userId: data.userId });
      if (existingConsultant) {
        throw new ConflictError('ALREADY_EXISTS', 'User is already registered as consultant');
      }

      // Create consultant
      const consultant = await insert<Consultant>('consultants', {
        userId: data.userId,
        status: ConsultantStatus.PENDING,
        verificationStatus: 'unverified',
        title: data.title,
        professionalBio: data.professionalBio,
        yearsOfExperience: data.yearsOfExperience,
        education: data.education || [],
        certifications: data.certifications || [],
        languagesSpoken: data.languagesSpoken,
        specializations: data.specializations,
        serviceTypes: data.serviceTypes,
        pricingModel: data.pricingModel,
        baseRate: data.baseRate,
        currency: 'USD',
        sessionDurationOptions: [30, 45, 60, 90],
        maxConcurrentSessions: 1,
        bufferTime: 15,
        availabilityType: 'fixed',
        weeklySchedule: data.weeklySchedule,
        blackoutDates: [],
        instantBookingEnabled: false,
        advanceBookingLimit: 30,
        cancellationPolicy: { freeCancellationHours: 24, partialRefundHours: 12, noRefundHours: 2 },
        aiCopilotEnabled: true,
        aiCopilotConfig: {},
        customPrompts: {},
        knowledgeBaseEnabled: false,
        totalSessions: 0,
        totalHours: 0,
        averageRating: 0,
        totalReviews: 0,
        repeatClientRate: 0,
        responseTimeAvg: 0,
        completionRate: 0,
        earningsTotal: 0,
        earningsThisMonth: 0,
      });

      // Add vertical associations
      for (const verticalId of data.verticalIds) {
        await insert('consultant_verticals', {
          consultantId: consultant.id,
          verticalId,
          expertiseLevel: 'intermediate',
          yearsInVertical: 0,
          isPrimary: false,
        });
      }

      // Publish consultant.created event
      await publishConsultantEvent('consultant.created', { id: consultant.id, userId: data.userId }, 'consultant-service');

      // Update user role to consultant
      await update('users', data.userId, { role: UserRole.CONSULTANT });

      logger.info('Consultant registered', { consultantId: consultant.id, userId: data.userId });

      reply.code(201).send({ id: consultant.id, status: consultant.status });
    }
  );

  // GET /consultants - Search consultants
  server.get<{ Querystring: z.infer<typeof searchConsultantsSchema> }>(
    '/',
    {
      schema: {
        tags: ['consultants'],
        summary: 'Search consultants',
        querystring: { type: 'object' },
        response: {
          200: {
            type: 'object',
            properties: {
              consultants: { type: 'array' },
              total: { type: 'number' },
              limit: { type: 'number' },
              offset: { type: 'number' },
            }
          }
        },
      },
    },
    async (request, reply) => {
      const { limit, offset, sort, order, language, minRating, maxPrice } = request.query;

      // Build query conditions
      let consultants = await findAll<Consultant>('consultants', { status: ConsultantStatus.ACTIVE }, { limit, offset });

      // Apply filters (in production, use proper SQL queries)
      if (minRating) {
        consultants = consultants.filter(c => c.averageRating >= minRating);
      }
      if (maxPrice) {
        consultants = consultants.filter(c => c.baseRate <= maxPrice);
      }
      if (language) {
        consultants = consultants.filter(c => c.languagesSpoken.includes(language));
      }

      // Sort
      if (sort === 'rating') {
        consultants.sort((a, b) => order === 'asc' ? a.averageRating - b.averageRating : b.averageRating - a.averageRating);
      } else if (sort === 'price') {
        consultants.sort((a, b) => order === 'asc' ? (a.baseRate || 0) - (b.baseRate || 0) : (b.baseRate || 0) - (a.baseRate || 0));
      }

      reply.code(200).send({
        consultants: consultants.map(c => ({
          id: c.id,
          userId: c.userId,
          title: c.title,
          professionalBio: c.professionalBio,
          yearsOfExperience: c.yearsOfExperience,
          languagesSpoken: c.languagesSpoken,
          specializations: c.specializations,
          serviceTypes: c.serviceTypes,
          pricingModel: c.pricingModel,
          baseRate: c.baseRate,
          averageRating: c.averageRating,
          totalReviews: c.totalReviews,
          totalSessions: c.totalSessions,
        })),
        total: consultants.length,
        limit,
        offset,
      });
    }
  );

  // GET /consultants/:id - Get consultant details
  server.get<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['consultants'],
        summary: 'Get consultant details',
        params: { type: 'object', properties: { id: { type: 'string' } } },
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const consultant = await findOne<Consultant>('consultants', { id });
      if (!consultant) {
        throw new NotFoundError('Consultant', id);
      }

      // Get user info
      const user = await findOne<User>('users', { id: consultant.userId });

      // Get verticals
      const consultantVerticals = await findAll('consultant_verticals', { consultantId: id });

      reply.code(200).send({
        id: consultant.id,
        userId: consultant.userId,
        user: user ? {
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        } : null,
        status: consultant.status,
        verificationStatus: consultant.verificationStatus,
        title: consultant.title,
        professionalBio: consultant.professionalBio,
        yearsOfExperience: consultant.yearsOfExperience,
        education: consultant.education,
        certifications: consultant.certifications,
        languagesSpoken: consultant.languagesSpoken,
        specializations: consultant.specializations,
        serviceTypes: consultant.serviceTypes,
        pricingModel: consultant.pricingModel,
        baseRate: consultant.baseRate,
        currency: consultant.currency,
        sessionDurationOptions: consultant.sessionDurationOptions,
        averageRating: consultant.averageRating,
        totalReviews: consultant.totalReviews,
        totalSessions: consultant.totalSessions,
        aiCopilotEnabled: consultant.aiCopilotEnabled,
        verticals: consultantVerticals,
      });
    }
  );

  // PUT /consultants/:id - Update consultant profile
  server.put<{ Params: { id: string }; Body: z.infer<typeof updateConsultantSchema> }>(
    '/:id',
    {
      schema: {
        tags: ['consultants'],
        summary: 'Update consultant profile',
        params: { type: 'object', properties: { id: { type: 'string' } } },
        body: { type: 'object' },
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const validation = updateConsultantSchema.safeParse(request.body);
      if (!validation.success) {
        throw new ValidationError('Invalid update data', validation.error.errors);
      }

      const consultant = await findOne<Consultant>('consultants', { id });
      if (!consultant) {
        throw new NotFoundError('Consultant', id);
      }

      // Check ownership

      const updated = await update<Consultant>('consultants', id, validation.data);

      await publishConsultantEvent('consultant.updated', { id }, 'consultant-service');

      logger.info('Consultant updated', { consultantId: id });

      reply.code(200).send(updated);
    }
  );

  // DELETE /consultants/:id - Delete consultant profile
  server.delete<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['consultants'],
        summary: 'Delete consultant profile',
        params: { type: 'object', properties: { id: { type: 'string' } } },
        response: { 200: { type: 'object', properties: { message: { type: 'string' } } } },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const consultant = await findOne<Consultant>('consultants', { id });
      if (!consultant) {
        throw new NotFoundError('Consultant', id);
      }

      await update<Consultant>('consultants', id, { status: ConsultantStatus.DELETED });

      logger.info('Consultant deleted', { consultantId: id });

      reply.code(200).send({ message: 'Consultant profile deleted' });
    }
  );

  // PUT /consultants/:id/ai-config - Update AI copilot configuration
  server.put<{ Params: { id: string }; Body: { aiCopilotEnabled?: boolean; aiCopilotConfig?: object } }>(
    '/:id/ai-config',
    {
      schema: {
        tags: ['consultants'],
        summary: 'Update AI copilot configuration',
        params: { type: 'object', properties: { id: { type: 'string' } } },
        body: { type: 'object' },
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { aiCopilotEnabled, aiCopilotConfig } = request.body;

      const consultant = await findOne<Consultant>('consultants', { id });
      if (!consultant) {
        throw new NotFoundError('Consultant', id);
      }

      const updated = await update<Consultant>('consultants', id, {
        aiCopilotEnabled,
        aiCopilotConfig: aiCopilotConfig || consultant.aiCopilotConfig,
      });

      logger.info('AI config updated', { consultantId: id });

      reply.code(200).send(updated);
    }
  );
}