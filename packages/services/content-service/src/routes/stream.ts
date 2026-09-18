import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { findOne, update } from '@consultancy/shared/database';
import { Content } from '@consultancy/shared/types';
import { NotFoundError, ForbiddenError } from '@consultancy/shared/utils/errors';

export default async function streamRoutes(server: FastifyInstance) {

  // GET /stream/:id - Stream content
  server.get<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      const { id } = request.params;
      const content = await findOne<Content>('content', { id });
      if (!content) throw new NotFoundError('Content', id);

      // Check access
      const userId = request.headers['x-user-id'] as string;
      if (content.pricing.model === 'paid' && !userId) {
        throw new ForbiddenError('Access denied');
      }

      // Update view count
      await update<Content>('content', id, { totalViews: content.totalViews + 1 });

      // Return stream URL (signed URL for S3)
      reply.code(200).send({
        streamUrl: content.fileUrl,
        contentType: content.contentType,
        durationMinutes: content.durationMinutes,
        chapters: content.chapters,
      });
    }
  );

  // GET /stream/:id/download - Download content
  server.get<{ Params: { id: string } }>(
    '/:id/download',
    async (request, reply) => {
      const { id } = request.params;
      const content = await findOne<Content>('content', { id });
      if (!content) throw new NotFoundError('Content', id);

      reply.code(200).send({ downloadUrl: content.fileUrl, filename: `${content.title}.mp4` });
    }
  );
}