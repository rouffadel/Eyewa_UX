import { TestBed } from '@angular/core/testing';
import { AuthTokenStorage } from './auth-token.storage';

describe('AuthTokenStorage', () => {
  let storage: AuthTokenStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    storage = TestBed.inject(AuthTokenStorage);
    storage.clear();
  });

  afterEach(() => {
    storage.clear();
  });

  it('should persist tokens in cookies by default', () => {
    storage.setTokens('access-token', 'refresh-token');

    expect(storage.getAccessToken()).toBe('access-token');
    expect(storage.getRefreshToken()).toBe('refresh-token');
    expect(document.cookie).toContain('eyewa_access_token=access-token');
  });

  it('should clear stored tokens', () => {
    storage.setTokens('access-token', 'refresh-token');
    storage.clear();

    expect(storage.getAccessToken()).toBeNull();
    expect(storage.getRefreshToken()).toBeNull();
  });
});
