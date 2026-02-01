import { compare } from 'bcryptjs';
import { db } from './database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest {
  username: string;
  password: string;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}

function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
}

async function hmacSha256(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function generateToken(username: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { username, exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) };
  
  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  
  const data = `${headerEncoded}.${payloadEncoded}`;
  const signature = await hmacSha256(data, JWT_SECRET);
  
  return `${data}.${signature}`;
}

export async function verifyToken(token: string): Promise<{ username: string } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [headerEncoded, payloadEncoded, signature] = parts;
    const data = `${headerEncoded}.${payloadEncoded}`;
    const expectedSignature = await hmacSha256(data, JWT_SECRET);
    
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(base64UrlDecode(payloadEncoded));
    
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return { username: payload.username };
  } catch {
    return null;
  }
}

export async function authenticateAdmin(username: string, password: string): Promise<string | null> {
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username) as {
    username: string;
    password_hash: string;
  } | undefined;

  if (!admin || !(await verifyPassword(password, admin.password_hash))) {
    return null;
  }

  return await generateToken(username);
}

export async function isAdmin(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const decoded = await verifyToken(token);
  if (!decoded) return false;
  
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(decoded.username);
  return !!admin;
}

export async function changePassword(username: string, oldPassword: string, newPassword: string): Promise<boolean> {
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username) as {
    username: string;
    password_hash: string;
  } | undefined;

  if (!admin || !(await verifyPassword(oldPassword, admin.password_hash))) {
    return false;
  }

  if (!newPassword || newPassword.length < 6) {
    return false;
  }

  const { hash } = await import('bcryptjs');
  const newPasswordHash = await hash(newPassword, 10);
  
  db.prepare('UPDATE admins SET password_hash = ? WHERE username = ?').run(newPasswordHash, username);
  return true;
}

