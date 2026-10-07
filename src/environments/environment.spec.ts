import { environment as developmentEnvironment } from './environment';
import { environment as productionEnvironment } from './environment.production';

describe('environment configuration', () => {
  it('keeps the local backend URL in development', () => {
    expect(developmentEnvironment.production).toBeFalse();
    expect(developmentEnvironment.apiUrl).toBe('http://localhost:3000');
  });

  it('uses a same-origin API path without localhost in production', () => {
    expect(productionEnvironment.production).toBeTrue();
    expect(productionEnvironment.apiUrl).toBe('/api');
    expect(productionEnvironment.apiUrl).not.toContain('localhost');
  });
});
