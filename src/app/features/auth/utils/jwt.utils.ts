const EXPIRY_SKEW_MS = 60_000;

export function getJwtExpiryMs(token: string): number | null {
  try {
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) {
      return null;
    }

    const payload = JSON.parse(atob(payloadSegment)) as { exp?: number };
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string, now = Date.now()): boolean {
  const expiry = getJwtExpiryMs(token);
  if (!expiry) {
    return false;
  }

  return expiry <= now + EXPIRY_SKEW_MS;
}
