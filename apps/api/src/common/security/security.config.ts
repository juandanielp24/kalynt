import { Injectable } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

@Injectable()
export class SecurityConfig {
  /**
   * Helmet configuration for security headers
   */
  static getHelmetConfig() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    });
  }

  /**
   * Rate limiting for API endpoints
   */
  static getRateLimitConfig() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      // Store in Redis for distributed systems
      store: process.env.REDIS_HOST ? this.getRedisStore() : undefined,
    });
  }

  /**
   * Slow down repeated requests
   */
  static getSlowDownConfig() {
    return slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 50, // Allow 50 requests per 15 minutes
      delayMs: 500, // Add 500ms of delay per request above 50
      maxDelayMs: 20000, // Maximum delay of 20 seconds
    });
  }

  /**
   * Strict rate limit for sensitive endpoints
   */
  static getStrictRateLimitConfig() {
    return rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5, // Only 5 requests per 15 minutes
      skipSuccessfulRequests: true, // Don't count successful requests
    });
  }

  private static getRedisStore() {
    // Implement Redis store for distributed rate limiting
    // return new RedisStore({ client: redisClient });
    return undefined;
  }
}
