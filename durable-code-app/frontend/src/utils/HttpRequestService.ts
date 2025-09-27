/**
 * Purpose: HTTP request service for link validation and URL health checking
 * Scope: HTTP request utilities with strategy pattern for flexible request handling
 * Overview: This module provides a comprehensive HTTP request service designed for link
 *     validation and URL health checking. It implements the strategy pattern to allow
 *     different request implementations, includes timeout handling, redirect control,
 *     and response validation. The service is used primarily for validating links and
 *     checking the health of external resources, providing detailed response information
 *     including status codes, response times, and error handling.
 * Dependencies: Fetch API for HTTP requests, AbortController for timeout handling
 * Exports: HttpRequestService class, request strategy interfaces, validation result types
 * Props/Interfaces: HttpRequestOptions, HttpResponse, RequestStrategy, ValidationResult
 * State/Behavior: Stateless service with configurable request strategies and timeout handling
 */

export interface HttpRequestOptions {
  timeout?: number;
  followRedirects?: boolean;
  checkHeaders?: boolean;
}

export interface HttpResponse {
  ok: boolean;
  status: number;
  responseTime: number;
}

export interface RequestStrategy {
  makeRequest(url: string, options: HttpRequestOptions): Promise<HttpResponse>;
}

export class FetchRequestStrategy implements RequestStrategy {
  async makeRequest(
    url: string,
    options: HttpRequestOptions = {},
  ): Promise<HttpResponse> {
    const { timeout = 5000, followRedirects = true } = options;
    const startTime = Date.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: followRedirects ? 'follow' : 'manual',
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      return {
        ok: response.ok,
        status: response.status,
        responseTime,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export function normalizeUrl(url: string): string {
  return url.startsWith('http') ? url : `${window.location.origin}/${url}`;
}

export class HttpRequestService {
  private strategy: RequestStrategy;

  constructor(strategy?: RequestStrategy) {
    this.strategy = strategy || new FetchRequestStrategy();
  }

  setStrategy(strategy: RequestStrategy): void {
    this.strategy = strategy;
  }

  async makeRequest(
    url: string,
    options: HttpRequestOptions = {},
  ): Promise<HttpResponse> {
    return this.strategy.makeRequest(url, options);
  }
}

export interface ValidationResult {
  url: string;
  isValid: boolean;
  status?: number;
  error?: string;
  responseTime: number;
}

export function createSuccessResult(
  url: string,
  response: HttpResponse,
): ValidationResult {
  return {
    url,
    isValid: response.ok,
    status: response.status,
    responseTime: response.responseTime,
  };
}

export function createErrorResult(
  url: string,
  error: unknown,
  responseTime: number,
): ValidationResult {
  return {
    url,
    isValid: false,
    error: error instanceof Error ? error.message : 'Unknown error',
    responseTime,
  };
}
