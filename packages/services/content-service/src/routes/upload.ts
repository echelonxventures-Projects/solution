import { FastifyInstance } from 'fastify';
import { findOne, update } from '@consultancy/shared/database';
import { Content } from '@consultancy/shared/types';
import { NotFoundError } from '@consultancy/shared/utils/errors';
import { logger } from '@consultancy/shared';

// Upload routes - Content file upload handlers

export default async function uploadRoutes(server: FastifyInstance) {

  // POST /upload - Upload content file
  server.post('/', async (request, reply) => {
    const parts = request.parts();
    const metadata: any = {};
    let fileData: Buffer | null = null;

    for await (const part of parts) {
      if (part.type === 'field') {
        metadata[part.fieldname] = part.value;
      } else if (part.type === 'file') {
        const buffer = await part.toBuffer();
        fileData = buffer;
        metadata.filename = part.filename;
        metadata.mimetype = part.mimetype;
      }
    }

    if (!metadata.contentId) {
      return reply.code(400).send({ error: 'contentId required' });
    }

    // Upload to S3/MinIO
    const fileUrl = `https://storage.example.com/content/${metadata.contentId}/${metadata.filename}`;

    const content = await findOne<Content>('content', { id: metadata.contentId });
    if (!content) throw new NotFoundError('Content', metadata.contentId);

    await update<Content>('content', metadata.contentId, {
      fileUrl,
      fileSize: fileData?.length || 0,
    });

    logger.info('Content uploaded', { contentId: metadata.contentId, fileUrl });

    reply.code(200).send({ fileUrl, fileSize: fileData?.length });
  });

  // POST /upload/thumbnail - Upload thumbnail
  server.post('/thumbnail', async (request, reply) => {
    const { contentId } = request.body as any;
    // Handle thumbnail upload
    const thumbnailUrl = `https://storage.example.com/thumbnails/${contentId}`;

    await update<Content>('content', contentId, { thumbnailUrl });
    reply.code(200).send({ thumbnailUrl });
  });
}