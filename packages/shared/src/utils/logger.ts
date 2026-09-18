import pino from 'pino';
import type { Logger } from 'pino';

export interface LogContext {
  service?: string;
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
}

const isDevelopment = process.env.NODE_ENV === 'development';

const transport = isDevelopment
  ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    }
  : undefined;

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport,
  base: {
    service: process.env.APP_NAME || 'consultancy-platform',
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});

export const createLogger = (context: LogContext) => logger.child(context);

export class RequestLogger {
  private log: Logger;

  constructor(requestId: string, service?: string, userId?: string) {
    this.log = createLogger({ requestId, service, userId });
  }

  info(message: string, data?: Record<string, unknown>) {
    this.log.info(data || {}, message);
  }

  debug(message: string, data?: Record<string, unknown>) {
    this.log.debug(data || {}, message);
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.log.warn(data || {}, message);
  }

  error(message: string, error?: Error | unknown, data?: Record<string, unknown>) {
    if (error instanceof Error) {
      this.log.error({ err: error, ...data }, message);
    } else {
      this.log.error({ error, ...data }, message);
    }
  }
}

export default logger;