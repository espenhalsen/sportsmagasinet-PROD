import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Use a default secret for development - should be in env variable in production
const JWT_SECRET = process.env.JWT_SECRET || 'sportsmagasinet-secret-key-2024-development';

export function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

export function generateInviteToken() {
  return Buffer.from(Math.random().toString(36).substring(2) + Date.now().toString(36)).toString('base64');
}

export function verifyInviteToken(token) {
  try {
    // For now, we just decode the token to verify it's valid base64
    // In a real system, you'd check this against the database
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    if (decoded && decoded.length > 0) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Invite token verification failed:', error);
    return false;
  }
}

export function extractBearerToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
