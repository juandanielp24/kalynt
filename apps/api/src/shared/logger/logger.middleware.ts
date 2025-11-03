import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from './logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    // Log cuando la respuesta termine
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      this.logger.logRequest(req, res, duration);
    });

    next();
  }
}
