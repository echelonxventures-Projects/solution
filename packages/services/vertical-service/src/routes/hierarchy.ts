import { FastifyInstance } from 'fastify';
import { NotFoundError } from '@consultancy/shared/utils/errors';
import { findOne, findAll } from '@consultancy/shared/database';
import { Vertical } from '@consultancy/shared/types';

export default async function hierarchyRoutes(server: FastifyInstance) {

  // GET /hierarchy - Get full vertical hierarchy tree
  server.get(
    '/',
    {
      schema: {
        tags: ['hierarchy'],
        summary: 'Get vertical hierarchy tree',
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const allVerticals = await findAll<Vertical>('verticals', { isActive: true }, { order: 'sort_order ASC' });

      // Build tree structure
      const buildTree = (parentId: string | null, level: number): any[] => {
        return allVerticals
          .filter(v => v.parentId === parentId && v.level === level)
          .map(v => ({
            id: v.id,
            code: v.code,
            name: v.name,
            description: v.description,
            iconUrl: v.iconUrl,
            colorCode: v.colorCode,
            totalConsultants: v.totalConsultants,
            children: buildTree(v.id, v.level + 1),
          }));
      };

      const tree = buildTree(null, 0);

      reply.code(200).send({
        tree,
        totalVerticals: allVerticals.length,
      });
    }
  );

  // GET /hierarchy/:id/sub-verticals - Get sub-verticals of a vertical
  server.get<{ Params: { id: string } }>(
    '/:id/sub-verticals',
    {
      schema: {
        tags: ['hierarchy'],
        summary: 'Get sub-verticals',
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

      const subVerticals = await findAll<Vertical>('verticals', { parentId: id, isActive: true });

      reply.code(200).send({
        parent: {
          id: vertical.id,
          name: vertical.name,
          code: vertical.code,
          level: vertical.level,
        },
        subVerticals: subVerticals.map(v => ({
          id: v.id,
          name: v.name,
          code: v.code,
          level: v.level,
          totalConsultants: v.totalConsultants,
        })),
      });
    }
  );

  // GET /hierarchy/:id/ancestors - Get ancestor chain
  server.get<{ Params: { id: string } }>(
    '/:id/ancestors',
    {
      schema: {
        tags: ['hierarchy'],
        summary: 'Get ancestor chain',
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

      // Build ancestor chain
      const ancestors: Vertical[] = [];
      let currentParentId = vertical.parentId;

      while (currentParentId) {
        const parent = await findOne<Vertical>('verticals', { id: currentParentId });
        if (parent) {
          ancestors.push(parent);
          currentParentId = parent.parentId;
        } else {
          break;
        }
      }

      reply.code(200).send({
        current: { id: vertical.id, name: vertical.name, code: vertical.code },
        ancestors: ancestors.map(a => ({ id: a.id, name: a.name, code: a.code })),
        breadcrumb: [...ancestors.reverse().map(a => a.name), vertical.name].join(' > '),
      });
    }
  );

  // GET /hierarchy/:id/path - Get full path from root to this vertical
  server.get<{ Params: { id: string } }>(
    '/:id/path',
    {
      schema: {
        tags: ['hierarchy'],
        summary: 'Get full path',
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

      // Get all ancestors
      const ancestors: Vertical[] = [];
      let currentParentId = vertical.parentId;

      while (currentParentId) {
        const parent = await findOne<Vertical>('verticals', { id: currentParentId });
        if (parent) {
          ancestors.push(parent);
          currentParentId = parent.parentId;
        } else break;
      }

      // Build path
      const path = [...ancestors.reverse(), vertical];

      reply.code(200).send({
        path: path.map(v => ({
          id: v.id,
          name: v.name,
          code: v.code,
          level: v.level,
        })),
        depth: vertical.level,
        pathString: path.map(v => v.name).join('/'),
      });
    }
  );

  // GET /hierarchy/featured - Get featured verticals
  server.get(
    '/featured',
    {
      schema: {
        tags: ['hierarchy'],
        summary: 'Get featured verticals',
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const featured = await findAll<Vertical>('verticals', { isFeatured: true, isActive: true }, { order: 'sort_order ASC' });

      reply.code(200).send({
        featured: featured.map(v => ({
          id: v.id,
          name: v.name,
          code: v.code,
          iconUrl: v.iconUrl,
          bannerUrl: v.bannerUrl,
          description: v.description,
          totalConsultants: v.totalConsultants,
          avgRating: v.avgRating,
        })),
      });
    }
  );

  // GET /hierarchy/root - Get root level verticals
  server.get(
    '/root',
    {
      schema: {
        tags: ['hierarchy'],
        summary: 'Get root level verticals',
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const roots = await findAll<Vertical>('verticals', { level: 0, isActive: true }, { order: 'sort_order ASC' });

      reply.code(200).send({
        roots: roots.map(v => ({
          id: v.id,
          name: v.name,
          code: v.code,
          iconUrl: v.iconUrl,
          totalConsultants: v.totalConsultants,
          childCount: 0,
        })),
      });
    }
  );
}