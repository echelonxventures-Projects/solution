import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { insert, findOne, findAll, update } from '@consultancy/shared/database';
import { Content, ContentStatus, ContentType } from '@consultancy/shared/types';
import { ValidationError, NotFoundError } from '@consultancy/shared/utils/errors';
import { logger } from '@consultancy/shared';

const searchContentSchema = z.object({
  vertical: z.string().optional(),
  type: z.enum(['video_class', 'audio_class', 'article', 'document']).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  language: z.string().optional(),
  creatorId: z.string().uuid().optional(),
  sort: z.enum(['recent', 'popular', 'rating', 'price']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const createContentSchema = z.object({
  creatorId: z.string().uuid(),
  title: z.string().min(2).max(200),
  description: z.string().max(2000),
  verticalId: z.string().uuid(),
  contentType: z.enum(['video_class', 'audio_class', 'article', 'document']),
  pricing: z.object({ model: z.enum(['free', 'paid', 'subscription']), price: z.number().optional() }),
  accessLevel: z.enum(['public', 'subscribers', 'purchased']),
});

export default async function contentRoutes(server: FastifyInstance) {

  // GET /content - Search content
  server.get<{ Querystring: z.infer<typeof searchContentSchema> }>(
    '/',
    async (request, reply) => {
      const { limit, offset, vertical, type, creatorId } = request.query;

      let content = await findAll<Content>('content', { status: ContentStatus.PUBLISHED }, { limit, offset });

      // Apply filters
      if (vertical) content = content.filter(c => c.verticalId === vertical);
      if (type) content = content.filter(c => c.contentType === type);
      if (creatorId) content = content.filter(c => c.creatorId === creatorId);

      reply.code(200).send({
        content: content.map(c => ({
          id: c.id, title: c.title, description: c.description, contentType: c.contentType,
          thumbnailUrl: c.thumbnailUrl, durationMinutes: c.durationMinutes, pricing: c.pricing,
          averageRating: c.averageRating, totalViews: c.totalViews, creatorId: c.creatorId,
        })),
        total: content.length, limit, offset,
      });
    }
  );

  // GET /content/:id - Get content details
  server.get<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      const { id } = request.params;
      const content = await findOne<Content>('content', { id });
      if (!content) throw new NotFoundError('Content', id);

      reply.code(200).send({
        ...content,
        chapters: content.chapters,
        aiSummary: content.aiSummary,
        aiKeywords: content.aiKeywords,
      });
    }
  );

  // POST /content - Create content
  server.post<{ Body: z.infer<typeof createContentSchema> }>(
    '/',
    async (request, reply) => {
      const validation = createContentSchema.safeParse(request.body);
      if (!validation.success) throw new ValidationError('Invalid content data', validation.error.errors);

      const data = validation.data;
      const content = await insert<Content>('content', {
        creatorId: data.creatorId,
        contentType: data.contentType as ContentType,
        status: ContentStatus.DRAFT,
        title: data.title,
        description: data.description,
        descriptionTranslations: {},
        verticalId: data.verticalId,
        fileUrl: '', // Will be set after upload
        fileSize: 0,
        pricing: data.pricing,
        averageRating: 0,
        totalReviews: 0,
        totalViews: 0,
        totalPurchases: 0,
        totalRevenue: 0,
        chapters: [],
        accessLevel: data.accessLevel,
      });

      logger.info('Content created', { contentId: content.id });
      reply.code(201).send(content);
    }
  );

  // PUT /content/:id - Update content
  server.put<{ Params: { id: string }; Body: Partial<z.infer<typeof createContentSchema>> }>(
    '/:id',
    async (request, reply) => {
      const { id } = request.params;
      const content = await findOne<Content>('content', { id });
      if (!content) throw new NotFoundError('Content', id);

      const updated = await update<Content>('content', id, request.body);
      reply.code(200).send(updated);
    }
  );

  // PUT /content/:id/publish - Publish content
  server.put<{ Params: { id: string } }>(
    '/:id/publish',
    async (request, reply) => {
      const { id } = request.params;
      const content = await findOne<Content>('content', { id });
      if (!content) throw new NotFoundError('Content', id);

      const updated = await update<Content>('content', id, { status: ContentStatus.PUBLISHED });
      logger.info('Content published', { contentId: id });
      reply.code(200).send(updated);
    }
  );

  // DELETE /content/:id - Delete content
  server.delete<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      const { id } = request.params;
      await update<Content>('content', id, { status: ContentStatus.DELETED });
      reply.code(200).send({ message: 'Content deleted' });
    }
  );

  // GET /content/creator/:creatorId - Get creator's content
  server.get<{ Params: { creatorId: string } }>(
    '/creator/:creatorId',
    async (request, reply) => {
      const { creatorId } = request.params;
      const content = await findAll<Content>('content', { creatorId }, { order: 'created_at DESC' });
      reply.code(200).send({ content, total: content.length });
    }
  );

  // GET /content/:id/transcript - Get content transcript
  server.get<{ Params: { id: string } }>(
    '/:id/transcript',
    async (request, reply) => {
      const { id } = request.params;
      const content = await findOne<Content>('content', { id });
      if (!content) throw new NotFoundError('Content', id);
      reply.code(200).send({ transcriptUrl: content.transcriptUrl, chapters: content.chapters });
    }
  );

  // GET /content/:id/chapters - Get content chapters
  server.get<{ Params: { id: string } }>(
    '/:id/chapters',
    async (request, reply) => {
      const { id } = request.params;
      const content = await findOne<Content>('content', { id });
      if (!content) throw new NotFoundError('Content', id);
      reply.code(200).send({ chapters: content.chapters });
    }
  );
}