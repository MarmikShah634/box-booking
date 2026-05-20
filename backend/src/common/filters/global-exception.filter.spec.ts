import {
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import type { ArgumentsHost } from '@nestjs/common';
import type { Request, Response } from 'express';

// ── Helpers ──────────────────────────────────────────────────────────────────

interface MockResponse {
  status: jest.Mock;
  json: jest.Mock;
}

function makeHost(
  requestOverrides: Partial<Request> = {},
): { host: ArgumentsHost; mockRes: MockResponse } {
  const mockJson = jest.fn();
  const mockStatus = jest.fn().mockReturnValue({ json: mockJson });

  const mockRes: MockResponse = { status: mockStatus, json: mockJson };

  const mockReq = {
    requestId: 'req-123',
    path: '/api/v1/test',
    method: 'GET',
    ...requestOverrides,
  } as unknown as Request;

  const host: ArgumentsHost = {
    switchToHttp: jest.fn().mockReturnValue({
      getResponse: jest.fn().mockReturnValue(mockRes as unknown as Response),
      getRequest: jest.fn().mockReturnValue(mockReq),
    }),
  } as unknown as ArgumentsHost;

  return { host, mockRes };
}

// ── GlobalExceptionFilter ─────────────────────────────────────────────────────

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    jest.clearAllMocks();
  });

  describe('HttpException handling', () => {
    it('responds with the correct HTTP status code from HttpException', () => {
      const { host, mockRes } = makeHost();
      const exception = new NotFoundException({ error: 'NOT_FOUND', message: 'Item not found' });

      filter.catch(exception, host);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    });

    it('includes error code from exception response body', () => {
      const { host, mockRes } = makeHost();
      const exception = new UnauthorizedException({ error: 'UNAUTHENTICATED', message: 'Not logged in' });

      filter.catch(exception, host);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'UNAUTHENTICATED' }),
      );
    });

    it('includes message from exception response body', () => {
      const { host, mockRes } = makeHost();
      const exception = new BadRequestException({ error: 'VALIDATION_ERROR', message: 'Invalid input' });

      filter.catch(exception, host);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Invalid input' }),
      );
    });

    it('includes statusCode in the response JSON', () => {
      const { host, mockRes } = makeHost();
      const exception = new BadRequestException({ error: 'BAD', message: 'Bad' });

      filter.catch(exception, host);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 }),
      );
    });

    it('includes requestId from the request in the response', () => {
      const { host, mockRes } = makeHost({ requestId: 'my-req-id' } as unknown as Partial<Request>);
      const exception = new BadRequestException({ error: 'BAD', message: 'Bad' });

      filter.catch(exception, host);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ requestId: 'my-req-id' }),
      );
    });

    it('uses string body as message when exception response is a string', () => {
      const { host, mockRes } = makeHost();
      const exception = new HttpException('plain string error', 422);

      filter.catch(exception, host);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'plain string error' }),
      );
    });

    it('handles exception body without error key gracefully', () => {
      const { host, mockRes } = makeHost();
      const exception = new HttpException({ message: 'No error key' }, 422);

      filter.catch(exception, host);

      const jsonArg = (mockRes.json as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
      expect(jsonArg['error']).toBeDefined();
    });
  });

  describe('Unknown / non-HTTP error handling', () => {
    it('responds with 500 for a generic Error', () => {
      const { host, mockRes } = makeHost();

      filter.catch(new Error('Something crashed'), host);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('uses INTERNAL_ERROR code for unknown errors', () => {
      const { host, mockRes } = makeHost();

      filter.catch(new Error('crash'), host);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'INTERNAL_ERROR' }),
      );
    });

    it('uses generic message for unknown errors', () => {
      const { host, mockRes } = makeHost();

      filter.catch(new Error('crash'), host);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'An unexpected error occurred' }),
      );
    });

    it('handles thrown string as unknown error', () => {
      const { host, mockRes } = makeHost();

      filter.catch('some string error', host);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'INTERNAL_ERROR' }),
      );
    });

    it('handles thrown null gracefully', () => {
      const { host, mockRes } = makeHost();

      filter.catch(null, host);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Logging behaviour', () => {
    it('logs error (not info) for 5xx responses', () => {
      const { host } = makeHost();
      const loggerErrorSpy = jest.spyOn(
        (filter as unknown as { logger: { error: jest.Mock; log: jest.Mock } }).logger,
        'error',
      );

      filter.catch(new Error('server crash'), host);

      expect(loggerErrorSpy).toHaveBeenCalled();
    });

    it('does not call logger.error for 4xx responses', () => {
      const { host } = makeHost();
      const loggerErrorSpy = jest.spyOn(
        (filter as unknown as { logger: { error: jest.Mock; log: jest.Mock } }).logger,
        'error',
      );

      filter.catch(new BadRequestException({ error: 'BAD', message: 'bad input' }), host);

      expect(loggerErrorSpy).not.toHaveBeenCalled();
    });

    it('calls logger.log (info) for 4xx responses', () => {
      const { host } = makeHost();
      const loggerLogSpy = jest.spyOn(
        (filter as unknown as { logger: { error: jest.Mock; log: jest.Mock } }).logger,
        'log',
      );

      filter.catch(new BadRequestException({ error: 'BAD', message: 'bad input' }), host);

      expect(loggerLogSpy).toHaveBeenCalled();
    });

    it('calls logger.error for HttpException with 5xx status', () => {
      const { host } = makeHost();
      const loggerErrorSpy = jest.spyOn(
        (filter as unknown as { logger: { error: jest.Mock; log: jest.Mock } }).logger,
        'error',
      );
      const exception = new HttpException({ error: 'SERVER_ERR', message: 'Oops' }, 503);

      filter.catch(exception, host);

      expect(loggerErrorSpy).toHaveBeenCalled();
    });
  });
});
