/** 32 random bytes in base64url. Anything else can't be a real token. */
export const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
