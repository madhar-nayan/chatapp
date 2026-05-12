import jwt from 'jsonwebtoken';
console.log("JWT_SECRET:", process.env.JWT_SECRET);

export function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  
}
