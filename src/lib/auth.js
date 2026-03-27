import crypto from 'crypto';

const SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || 'dev-secret-change-this';

export function signToken(payload) {
  const json = JSON.stringify(payload);
  const b = Buffer.from(json).toString('base64');
  const sig = crypto.createHmac('sha256', SECRET).update(b).digest('hex');
  return `${b}.${sig}`;
}

export function verifyToken(token) {
  if (!token) return null;
  const [b, sig] = token.split('.');
  if (!b || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(b).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  try {
    const payload = JSON.parse(Buffer.from(b, 'base64').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}