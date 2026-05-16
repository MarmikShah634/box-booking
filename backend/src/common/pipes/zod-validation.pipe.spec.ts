import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';
import type { ArgumentMetadata } from '@nestjs/common';

// ── Helpers ──────────────────────────────────────────────────────────────────

// A minimal ArgumentMetadata stub; the pipe ignores _metadata
const METADATA: ArgumentMetadata = { type: 'body', metatype: undefined, data: undefined };

// ── ZodValidationPipe ─────────────────────────────────────────────────────────

describe('ZodValidationPipe', () => {
  describe('with valid data', () => {
    it('passes valid data through unchanged', () => {
      const schema = z.object({ name: z.string(), age: z.number() });
      const pipe = new ZodValidationPipe(schema);
      const input = { name: 'Alice', age: 30 };

      const result = pipe.transform(input, METADATA);

      expect(result).toEqual(input);
    });

    it('returns coerced/transformed data from Zod (e.g. trimmed strings)', () => {
      const schema = z.object({ name: z.string().trim() });
      const pipe = new ZodValidationPipe(schema);

      const result = pipe.transform({ name: '  Bob  ' }, METADATA);

      expect((result as { name: string }).name).toBe('Bob');
    });

    it('passes through primitive values when schema is a primitive', () => {
      const schema = z.string().min(3);
      const pipe = new ZodValidationPipe(schema);

      const result = pipe.transform('hello', METADATA);

      expect(result).toBe('hello');
    });
  });

  describe('with invalid data', () => {
    it('throws BadRequestException for invalid data', () => {
      const schema = z.object({ email: z.string().email() });
      const pipe = new ZodValidationPipe(schema);

      expect(() => pipe.transform({ email: 'not-an-email' }, METADATA)).toThrow(
        BadRequestException,
      );
    });

    it('includes VALIDATION_ERROR error code in the exception response', () => {
      const schema = z.object({ age: z.number() });
      const pipe = new ZodValidationPipe(schema);

      try {
        pipe.transform({ age: 'not-a-number' }, METADATA);
      } catch (e) {
        const ex = e as BadRequestException;
        const body = ex.getResponse() as Record<string, unknown>;
        expect(body['error']).toBe('VALIDATION_ERROR');
      }
    });

    it('includes statusCode 400 in the exception response', () => {
      const schema = z.object({ age: z.number() });
      const pipe = new ZodValidationPipe(schema);

      try {
        pipe.transform({ age: 'not-a-number' }, METADATA);
      } catch (e) {
        const ex = e as BadRequestException;
        const body = ex.getResponse() as Record<string, unknown>;
        expect(body['statusCode']).toBe(400);
      }
    });

    it('includes field-level issues array in the exception response', () => {
      const schema = z.object({ name: z.string(), age: z.number().int().positive() });
      const pipe = new ZodValidationPipe(schema);

      try {
        pipe.transform({ name: 123, age: -5 }, METADATA);
      } catch (e) {
        const ex = e as BadRequestException;
        const body = ex.getResponse() as Record<string, unknown>;
        const issues = body['issues'] as Array<{ path: string; message: string }>;
        expect(Array.isArray(issues)).toBe(true);
        expect(issues.length).toBeGreaterThanOrEqual(1);
        expect(issues[0]).toHaveProperty('path');
        expect(issues[0]).toHaveProperty('message');
      }
    });

    it('reports correct field path in issues', () => {
      const schema = z.object({ user: z.object({ email: z.string().email() }) });
      const pipe = new ZodValidationPipe(schema);

      try {
        pipe.transform({ user: { email: 'bad' } }, METADATA);
      } catch (e) {
        const ex = e as BadRequestException;
        const body = ex.getResponse() as Record<string, unknown>;
        const issues = body['issues'] as Array<{ path: string; message: string }>;
        expect(issues[0].path).toBe('user.email');
      }
    });

    it('throws BadRequestException (not 500) for a schema mismatch', () => {
      const schema = z.string();
      const pipe = new ZodValidationPipe(schema);

      let thrown: unknown;
      try {
        pipe.transform(42, METADATA);
      } catch (e) {
        thrown = e;
      }

      expect(thrown).toBeInstanceOf(BadRequestException);
      expect((thrown as BadRequestException).getStatus()).toBe(400);
    });

    it('includes "Invalid request" as top-level message', () => {
      const schema = z.object({ count: z.number() });
      const pipe = new ZodValidationPipe(schema);

      try {
        pipe.transform({ count: 'abc' }, METADATA);
      } catch (e) {
        const ex = e as BadRequestException;
        const body = ex.getResponse() as Record<string, unknown>;
        expect(body['message']).toBe('Invalid request');
      }
    });
  });
});
