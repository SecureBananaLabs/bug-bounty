typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { createTestUser, generateTestEmail, cleanupTestUser } from '../helpers/auth';
import { Logger } from '../../src/lib/logger';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

const logger = new Logger('RegistrationFullNameValidation');

interface RegistrationResponse {
  body: {
    user?: {
      fullName?: string;
      email?: string;
      role?: string;
      id?: string;
      [key: string]: unknown;
    };
    error?: string;
    [key: string]: unknown;
  };
  status: number;
  [key: string]: unknown;
}

interface TestError extends Error {
  status?: number;
  response?: {
    body?: unknown;
    status?: number;
  };
}

describe('Registration - fullName Validation', () => {
  const testEmail: string = generateTestEmail();
  const testPassword: string = 'TestPass123!';
  const testFullName: string = 'John Doe';
  const testRole: string = 'USER';
  const MAX_FULLNAME_LENGTH: number = 255;
  const SPECIAL_CHARACTERS_NAME: string = "O'Brien-Müller 2.0";

  beforeAll(async (): Promise<void> => {
    logger.info('Starting fullName validation tests', {
      testEmail,
      testRole,
      timestamp: new Date().toISOString(),
    });
  });

  afterAll(async (): Promise<void> => {
    try {
      await cleanupTestUser(testEmail);
      await prisma.$disconnect();
      logger.info('Test cleanup completed successfully', {
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError) {
        logger.error('Prisma error during test cleanup', {
          code: error.code,
          message: error.message,
          meta: error.meta,
        });
      } else if (error instanceof Error) {
        logger.error('Error during test cleanup', {
          message: error.message,
          stack: error.stack,
        });
      } else {
        logger.error('Unknown error during test cleanup', {
          error: String(error),
        });
      }
      throw error;
    }
  });

  describe('Missing fullName rejection', () => {
    it('should reject registration without fullName field', async (): Promise<void> => {
      try {
        const response: RegistrationResponse = await request(app)
          .post('/api/auth/register')
          .send({
            email: testEmail,
            password: testPassword,
            role: testRole,
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('fullName');
        expect(typeof response.body.error).toBe('string');
        logger.info('Registration without fullName correctly rejected', {
          statusCode: response.status,
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          logger.error('Test failed: missing fullName field', {
            message: error.message,
            stack: error.stack,
          });
        }
        throw error;
      }
    });

    it('should reject registration with empty fullName string', async (): Promise<void> => {
      try {
        const response: RegistrationResponse = await request(app)
          .post('/api/auth/register')
          .send({
            email: testEmail,
            password: testPassword,
            role: testRole,
            fullName: '',
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('fullName');
        expect(response.body.error).toContain('empty');
        logger.info('Registration with empty fullName correctly rejected', {
          statusCode: response.status,
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          logger.error('Test failed: empty fullName string', {
            message: error.message,
            stack: error.stack,
          });
        }
        throw error;
      }
    });

    it('should reject registration with whitespace-only fullName', async (): Promise<void> => {
      try {
        const response: RegistrationResponse = await request(app)
          .post('/api/auth/register')
          .send({
            email: testEmail,
            password: testPassword,
            role: testRole,
            fullName: '   ',
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('fullName');
        expect(response.body.error).toContain('whitespace');
        logger.info('Registration with whitespace-only fullName correctly rejected', {
          statusCode: response.status,
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          logger.error('Test failed: whitespace-only fullName', {
            message: error.message,
            stack: error.stack,
          });
        }
        throw error;
      }
    });

    it('should reject registration with null fullName', async (): Promise<void> => {
      try {
        const response: RegistrationResponse = await request(app)
          .post('/api/auth/register')
          .send({
            email: testEmail,
            password: testPassword,
            role: testRole,
            fullName: null,
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('fullName');
        expect(response.body.error).toContain('null');
        logger.info('Registration with null fullName correctly rejected', {
          statusCode: response.status,
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          logger.error('Test failed: null fullName', {
            message: error.message,
            stack: error.stack,
          });
        }
        throw error;
      }
    });

    it('should reject registration with undefined fullName', async (): Promise<void> => {
      try {
        const response: RegistrationResponse = await request(app)
          .post('/api/auth/register')
          .send({
            email: testEmail,
            password: testPassword,
            role: testRole,
            fullName: undefined,
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('fullName');
        expect(response.body.error).toContain('undefined');
        logger.info('Registration with undefined fullName correctly rejected', {
          statusCode: response.status,
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          logger.error('Test failed: undefined fullName', {
            message: error.message,
            stack: error.stack,
          });
        }
        throw error;
      }
    });

    it('should reject registration with non-string fullName', async (): Promise<void> => {
      try {
        const response: RegistrationResponse = await request(app)
          .post('/api/auth/register')
          .send({
            email: testEmail,
            password: testPassword,
            role: testRole,
            fullName: 12345,
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('fullName');
        expect(response.body.error).toContain('string');
        logger.info('Registration with non-string fullName correctly rejected', {
          statusCode: response.status,
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          logger.error('Test failed: non-string fullName', {
            message: error.message,
            stack: error.stack,
          });
        }
        throw error;
      }
    });
  });

  describe('Valid fullName preservation', () => {
    it('should accept registration with valid fullName', async (): Promise<void> => {
      try {
        const response: RegistrationResponse = await request(app)
          .post('/api/auth/register')
          .send({
            email: testEmail,
            password: testPassword,
            role: testRole,
            fullName: testFullName,
          })
          .expect(201);

        expect(response.body).toHaveProperty('user');
        expect(response.body.user).toHaveProperty('fullName');
        expect(response.body.user?.fullName).toBe(testFullName);
        expect(response.body.user?.email).toBe(testEmail);
        expect(response.body.user?.role).toBe(testRole);
        logger.info('Registration with valid fullName accepted', {
          fullName: testFullName,
          email: testEmail,
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          logger.error('Test failed: valid fullName acceptance', {
            message: error.message,
            stack: error.stack,
          });
        }
        throw error;
      }
    });

    it('should preserve fullName in returned user payload', async (): Promise<void> => {
      try {
        const uniqueEmail: string = generateTestEmail();
        const response: RegistrationResponse = await request(app)
          .post('/api/auth/register')
          .send({
            email: uniqueEmail,
            password: testPassword,
            role: testRole,
            fullName: 'Jane Smith',
          })
          .expect(201);

        expect(response.body.user?.fullName).toBe('Jane Smith');
        expect(response.body.user).not.toHaveProperty('password');
        expect(response.body.user).toHaveProperty('id');
        expect(response.body.user).toHaveProperty('email');
        expect(response.body.user?.email).toBe(uniqueEmail);
        logger.info('fullName preserved in user payload', {
          userId: response.body.user?.id,
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          logger.error('Test failed: fullName preservation in payload', {
            message: error.message,
            stack: error.stack,
          });
        }
        throw error;
      }
    });

    it('should accept fullName with special characters', async (): Promise<void> => {
      try {
        const response: RegistrationResponse = await request(app)
          .post('/api/auth/register')
          .send({
            email: generateTestEmail(),
            password: testPassword,
            role: testRole,
            fullName: SPECIAL_CHARACTERS_NAME,
          })
          .expect(201);

        expect(response.body.user?.fullName).toBe(SPECIAL_CHARACTERS_NAME);
        expect(response.body.user?.fullName).toContain("'");
        expect(response.body.user?.fullName).toContain('-');
        expect(response.body.user?.fullName).toContain('ü');
        logger.info('fullName with special characters accepted', {
          fullName: SPECIAL_CHARACTERS_NAME,
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          logger.error('Test failed: special characters in fullName', {
            message: error.message,
            stack: error.stack,
          });
        }
        throw error;
      }
    });

    it('should accept fullName with maximum allowed length', async (): Promise<void> => {
      try {
        const longName: string = 'A'.repeat(MAX_FULLNAME_LENGTH);
        const response: RegistrationResponse = await request(app)
          .post('/api/auth/register')
          .send({
            email: generateTestEmail(),
            password: testPassword,
            role: testRole,
            fullName: longName,
          })
          .expect(201);

        expect(response.body.user?.fullName).toBe(longName);
        expect(response.body.user?.fullName.length).toBe(MAX_FULLNAME_LENGTH);
        logger.info('fullName with maximum length accepted', {
          length: MAX_FULLNAME_LENGTH,
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          logger.error('Test failed: maximum length fullName', {
            message: error.message,
            stack: error.stack,
          });
        }
        throw error;
      }
    });

    it('should accept fullName with minimum valid length', async (): Promise<void> => {
      try {
        const minName: string = 'A';
        const response: RegistrationResponse = await request(app)
          .post('/api/auth/register')
          .send({
            email: generateTestEmail(),
            password: testPassword,
            role: testRole,
            fullName: minName,
          })
          .expect(201);

        expect(response.body.user?.fullName).toBe(minName);
        expect(response.body.user?.fullName.length).toBe(1);
        logger.info('fullName with minimum length accepted', {
          length: 1,
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          logger.error('Test failed: minimum length fullName', {
            message: error.message,
            stack: error.stack,
          });
        }
        throw error;
      }
    });

    it('should accept fullName with multiple words and spaces', async (): Promise<void> => {
      try {
        const multiWordName: string = 'John Michael William Doe';
        const response: RegistrationResponse = await request(app)
          .post('/api/auth/register')
          .send({
            email: generateTestEmail(),
            password: testPassword,
            role: testRole,
            fullName: multiWordName,
          })
          .expect(201);

        expect(response.body.user?.fullName).toBe(multiWordName);
        expect(response.body.user?.fullName.split(' ').length).toBe(4);
        logger.info('fullName with multiple words accepted', {
          wordCount: 4,
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          logger.error('Test failed: multiple words fullName', {
            message: error.message,
            stack: error.stack,
          });
        }
        throw error;
      }
    });
  });

  describe('Edge cases and security', () => {
    it('should reject fullName exceeding maximum length', async (): Promise<void> => {
      try {
        const tooLongName: string = 'A'.repeat(MAX_FULLNAME_LENGTH + 1);
        const response: RegistrationResponse = await request(app)
          .post('/api/auth/register')
          .send({
            email: generateTestEmail(),
            password: testPassword,
            role: testRole,
            fullName: tooLongName,
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('fullName');
        expect(response.body.error).toContain('length');
        logger.info('fullName exceeding maximum length correctly rejected', {
          attemptedLength: MAX_FULLNAME_LENGTH + 1,
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          logger.error('Test failed: exceeding maximum length fullName', {
            message: error.message,
            stack: error.stack,
          });
        }
        throw error;
      }
    });

    it('should sanitize fullName with HTML content', async (): Promise<void> => {
      try {
        const maliciousName: string = '<script>alert("xss")</script>';
        const response: RegistrationResponse = await request(app)
          .post('/api/auth/register')
          .send({
            email: generateTestEmail(),
            password: testPassword,
            role: testRole,
            fullName: maliciousName,
          })
          .expect(201);

        expect(response.body.user?.fullName).not.toContain('<script>');
        expect(response.body.user?.fullName).not.toContain('alert');
        logger.info('fullName with HTML content sanitized', {
          originalLength: maliciousName.length,
          sanitizedLength: response.body.user?.fullName.length,
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          logger.error('Test failed: HTML content in fullName', {
            message: error.message,
            stack: error.stack,
          });
        }
        throw error;
      }
    });

    it('should handle concurrent registration requests', async (): Promise<void> => {
      try {
        const concurrentRequests: Promise<RegistrationResponse>[] = Array.from(
          { length: 5 },
          (_, index: number) => {
            return request(app)
              .post('/api/auth/register')
              .send({
                email: generateTestEmail(),
                password: testPassword,
                role: testRole,
                fullName: `Concurrent User ${index}`,
              })
              .expect(201);
          }
        );

        const responses: RegistrationResponse[] = await Promise.all(concurrentRequests);
        
        responses.forEach((response: RegistrationResponse, index: number): void => {
          expect(response.body).toHaveProperty('user');
          expect(response.body.user).toHaveProperty('fullName');
          expect(response.body.user?.fullName).toBe(`Concurrent User ${index}`);
        });

        logger.info('Concurrent registration requests handled successfully', {
          requestCount: concurrentRequests.length,
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          logger.error('Test failed: concurrent registration requests', {
            message: error.message,
            stack: error.stack,
          });
        }
        throw error;
      }
    });
  });
});