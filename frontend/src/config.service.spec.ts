import { TestBed } from '@angular/core/testing';
import { ConfigService } from './config.service';

const appWindow = window as Window & { APP_CONFIG?: unknown };

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(() => {
    delete appWindow.APP_CONFIG;
    service = TestBed.inject(ConfigService);
  });

  afterEach(() => {
    delete appWindow.APP_CONFIG;
    vi.restoreAllMocks();
  });

  describe('with a runtime config', () => {
    it('exposes the api url and environment', () => {
      // Arrange
      appWindow.APP_CONFIG = { apiUrl: 'http://api.test', environment: 'TEST' };

      // Act
      const config = { apiUrl: service.apiUrl, environment: service.environment };

      // Assert
      expect(config).toEqual({ apiUrl: 'http://api.test', environment: 'TEST' });
    });

    it('reads the config on every access rather than at construction', () => {
      // Arrange
      appWindow.APP_CONFIG = { apiUrl: 'http://first.test', environment: 'DEV' };
      const before = service.apiUrl;

      // Act
      appWindow.APP_CONFIG = { apiUrl: 'http://second.test', environment: 'PROD' };

      // Assert
      expect(before).toBe('http://first.test');
      expect(service.apiUrl).toBe('http://second.test');
      expect(service.environment).toBe('PROD');
    });

    it('falls back to empty strings for missing fields', () => {
      // Arrange
      appWindow.APP_CONFIG = {};

      // Act
      const config = { apiUrl: service.apiUrl, environment: service.environment };

      // Assert
      expect(config).toEqual({ apiUrl: '', environment: '' });
    });
  });

  describe('without a runtime config', () => {
    it('returns empty strings instead of throwing', () => {
      // Arrange
      delete appWindow.APP_CONFIG;

      // Act
      const config = { apiUrl: service.apiUrl, environment: service.environment };

      // Assert
      expect(config).toEqual({ apiUrl: '', environment: '' });
    });
  });
});
