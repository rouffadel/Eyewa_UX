import { getJwtExpiryMs, isJwtExpired } from './jwt.utils';

describe('jwt.utils', () => {
  const expiredToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 120 })) +
    '.signature';

  const validToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })) +
    '.signature';

  it('should read jwt expiry', () => {
    const expiry = getJwtExpiryMs(validToken);
    expect(expiry).not.toBeNull();
    expect(expiry!).toBeGreaterThan(Date.now());
  });

  it('should detect expired jwt', () => {
    expect(isJwtExpired(expiredToken)).toBeTrue();
    expect(isJwtExpired(validToken)).toBeFalse();
  });
});
