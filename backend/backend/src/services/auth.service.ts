import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUsersCollection, getCustomersCollection } from '../db/collections.js';
import { UserDocument, CustomerDocument } from '../types/domain.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

const JWT_SECRET = env.JWT_SECRET || 'wardrobeiq-secret-jwt-key-2026-production';
const TOKEN_EXPIRY = '7d';

export interface AuthResponse {
  user: Omit<UserDocument, 'passwordHash'>;
  token: string;
}

export function generateToken(user: { userId: string; email: string; role: string }): string {
  return jwt.sign(
    {
      userId: user.userId,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export async function registerUser(input: {
  email: string;
  password: string;
  name: string;
  country?: string;
  city?: string;
  preferredStyles?: string[];
  themePreference?: 'light' | 'dark' | 'system';
}): Promise<AuthResponse> {
  const usersCol = getUsersCollection();
  const customersCol = getCustomersCollection();

  const normalizedEmail = input.email.trim().toLowerCase();
  const existing = await usersCol.findOne({ email: normalizedEmail });
  if (existing) {
    throw ApiError.conflict('An account with this email address already exists.');
  }

  if (input.password.length < 6) {
    throw ApiError.badRequest('Password must be at least 6 characters long.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(input.password, salt);

  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newUser: UserDocument = {
    userId,
    customerId: userId,
    email: normalizedEmail,
    passwordHash,
    name: input.name.trim(),
    avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80`,
    role: normalizedEmail.includes('admin') ? 'admin' : 'user',
    country: input.country || 'India',
    city: input.city || 'Mumbai',
    climate: 'tropical',
    preferredLanguage: 'English',
    preferredStyles: input.preferredStyles || ['smart-casual', 'minimalist'],
    preferredColors: ['black', 'navy', 'white'],
    avoidedColors: ['neon'],
    budget: 3500,
    preferredOccasions: ['casual', 'workwear', 'weekend'],
    currentSeason: 'all-season',
    themePreference: input.themePreference || 'system',
    createdAt: now,
    updatedAt: now,
  };

  await usersCol.insertOne(newUser);

  // Synchronize a CustomerDocument so existing customer-based APIs work automatically
  const newCustomer: CustomerDocument = {
    customerId: userId,
    name: newUser.name,
    avatar: newUser.avatar,
    country: newUser.country,
    city: newUser.city,
    climate: newUser.climate,
    preferredStyles: newUser.preferredStyles,
    preferredColors: newUser.preferredColors,
    avoidedColors: newUser.avoidedColors,
    budget: newUser.budget,
    preferredOccasions: newUser.preferredOccasions,
    currentSeason: newUser.currentSeason,
    themePreference: newUser.themePreference,
    createdAt: now,
    updatedAt: now,
  };
  await customersCol.insertOne(newCustomer);

  logger.info(`User registered successfully: ${normalizedEmail} (${userId})`);

  const token = generateToken(newUser);
  const { passwordHash: _, ...userSafe } = newUser;
  return { user: userSafe, token };
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const usersCol = getUsersCollection();
  const normalizedEmail = email.trim().toLowerCase();

  const user = await usersCol.findOne({ email: normalizedEmail });
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const token = generateToken(user);
  const { passwordHash: _, ...userSafe } = user;
  logger.info(`User logged in: ${normalizedEmail} (${user.userId})`);
  return { user: userSafe, token };
}

export async function getUserById(userId: string): Promise<Omit<UserDocument, 'passwordHash'> | null> {
  const usersCol = getUsersCollection();
  const user = await usersCol.findOne({ $or: [{ userId }, { customerId: userId }] });
  if (!user) return null;
  const { passwordHash: _, ...safe } = user;
  return safe;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<UserDocument>
): Promise<Omit<UserDocument, 'passwordHash'>> {
  const usersCol = getUsersCollection();
  const customersCol = getCustomersCollection();

  delete updates.passwordHash;
  delete updates._id;
  delete updates.userId;

  updates.updatedAt = new Date().toISOString();

  await usersCol.updateOne(
    { $or: [{ userId }, { customerId: userId }] },
    { $set: updates }
  );

  // Also sync to customer document
  await customersCol.updateOne(
    { customerId: userId },
    { $set: updates }
  );

  const updated = await getUserById(userId);
  if (!updated) throw ApiError.notFound('User not found');
  return updated;
}

export async function resetPassword(email: string, newPassword: string): Promise<void> {
  const usersCol = getUsersCollection();
  const normalizedEmail = email.trim().toLowerCase();

  const user = await usersCol.findOne({ email: normalizedEmail });
  if (!user) {
    throw ApiError.notFound('No account found with this email.');
  }

  if (newPassword.length < 6) {
    throw ApiError.badRequest('Password must be at least 6 characters long.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);
  await usersCol.updateOne(
    { email: normalizedEmail },
    { $set: { passwordHash, updatedAt: new Date().toISOString() } }
  );

  logger.info(`Password reset for ${normalizedEmail}`);
}

export async function getDemoPersonas(): Promise<Array<{
  userId: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  country: string;
  styles: string[];
}>> {
  const usersCol = getUsersCollection();
  const users = await usersCol.find({}).limit(20).toArray();
  return users.map((u) => ({
    userId: u.userId,
    name: u.name,
    email: u.email,
    avatar: u.avatar,
    role: u.role,
    country: u.country || 'Global',
    styles: u.preferredStyles || ['smart-casual'],
  }));
}
