/**
 * Purpose: Unit tests for WebSocket service port calculation logic
 * Scope: Test dynamic port detection for development environments
 * Overview: Validates that the WebSocket service correctly calculates backend ports
 *     based on the frontend port in development mode, ensuring proper connection
 *     to branch-specific backend instances.
 * Dependencies: vitest, WebSocketService
 * Exports: Test suite for WebSocketService port calculation
 * Interfaces: vitest test functions
 * Implementation: Unit tests with mocked window.location
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocketService } from './websocketService';

// Store created WebSocket URLs
let createdUrls: string[] = [];

// Mock WebSocket
class MockWebSocket {
  url: string;
  readyState: number = 0;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: (() => void) | null = null;

  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  constructor(url: string) {
    this.url = url;
    createdUrls.push(url);
  }

  close() {}
  send(_data: string) {}
}

global.WebSocket = MockWebSocket as unknown as typeof WebSocket;

describe('WebSocketService Port Calculation', () => {
  let service: WebSocketService;
  let originalLocation: Location;

  beforeEach(() => {
    service = new WebSocketService();
    originalLocation = window.location;
    createdUrls = [];
    // Reset WebSocket mock tracking
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  const mockLocation = (port: string, hostname: string = 'localhost') => {
    Object.defineProperty(window, 'location', {
      value: {
        ...originalLocation,
        port,
        hostname,
        protocol: 'http:',
      },
      writable: true,
    });
  };

  it('should use backend port 8000 for frontend port 5173 (main branch)', () => {
    mockLocation('5173');

    // Try to connect without URL - should auto-generate
    service.connect().catch(() => {}); // Ignore connection errors

    // Check the WebSocket was created with correct URL
    expect(createdUrls).toHaveLength(1);
    expect(createdUrls[0]).toBe('ws://localhost:8000/api/oscilloscope/stream');
  });

  it('should use backend port 8210 for frontend port 5383 (feature branch)', () => {
    mockLocation('5383');

    service.connect().catch(() => {});

    expect(createdUrls).toHaveLength(1);
    expect(createdUrls[0]).toBe('ws://localhost:8210/api/oscilloscope/stream');
  });

  it('should use backend port 8999 for frontend port 6172 (max offset)', () => {
    mockLocation('6172');

    service.connect().catch(() => {});

    expect(createdUrls).toHaveLength(1);
    expect(createdUrls[0]).toBe('ws://localhost:8999/api/oscilloscope/stream');
  });

  it('should use default port 8000 for production (no port)', () => {
    mockLocation('');

    service.connect().catch(() => {});

    expect(createdUrls).toHaveLength(1);
    expect(createdUrls[0]).toBe('ws://localhost/api/oscilloscope/stream');
  });

  it('should use default port 8000 for standard HTTP port 80', () => {
    mockLocation('80');

    service.connect().catch(() => {});

    expect(createdUrls).toHaveLength(1);
    expect(createdUrls[0]).toBe('ws://localhost/api/oscilloscope/stream');
  });

  it('should use same port for non-dev ports (proxy scenario)', () => {
    mockLocation('3000');

    service.connect().catch(() => {});

    expect(createdUrls).toHaveLength(1);
    expect(createdUrls[0]).toBe('ws://localhost:3000/api/oscilloscope/stream');
  });

  it('should use provided URL if specified', () => {
    const customUrl = 'ws://custom.example.com:9000/custom/path';

    service.connect(customUrl).catch(() => {});

    expect(createdUrls).toHaveLength(1);
    expect(createdUrls[0]).toBe(customUrl);
  });

  it('should calculate correct offset for various branch ports', () => {
    const testCases = [
      { frontend: 5174, backend: 8001 }, // offset 1
      { frontend: 5273, backend: 8100 }, // offset 100
      { frontend: 5673, backend: 8500 }, // offset 500
    ];

    testCases.forEach(({ frontend, backend }) => {
      // Clear URLs from previous iterations
      createdUrls = [];
      // Create a new service instance for each test case
      const testService = new WebSocketService();
      mockLocation(frontend.toString());
      testService.connect().catch(() => {});

      expect(createdUrls).toHaveLength(1);
      expect(createdUrls[0]).toBe(`ws://localhost:${backend}/api/oscilloscope/stream`);
    });
  });
});
