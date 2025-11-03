import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthMiddleware } from './auth.middleware';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplicar middleware de auth a todas las rutas protegidas
    consumer
      .apply(AuthMiddleware)
      .forRoutes('*');
  }
}
