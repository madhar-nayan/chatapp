import jwt from 'jsonwebtoken';

const getSecret = () => process.env.JWT_SECRET || 'mysupersecret123';

export function signToken(userId) {
  return jwt.sign({ sub: userId }, getSecret(), { expiresIn: '7d' });
}
