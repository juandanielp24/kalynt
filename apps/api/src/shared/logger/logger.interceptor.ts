import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoggerService } from './logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.debug(`${method} ${url} - ${duration}ms`, 'HTTP');
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        this.logger.error(
          `${method} ${url} - ${duration}ms - Error: ${error.message}`,
          error.stack,
          'HTTP'
        );
        return throwError(() => error);
      })
    );
  }
}
