import { Request, Response, NextFunction } from 'express';
import {
  registerUser,
  loginUser,
  getUserById,
  updateUserProfile,
  resetPassword,
  getDemoPersonas,
} from '../services/auth.service.js';
import { successResponse, ApiError } from '../utils/response.js';

export async function registerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await registerUser(req.body);
    return successResponse(res, result, 201);
  } catch (error) {
    next(error);
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required.');
    }
    const result = await loginUser(email, password);
    return successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function logoutHandler(req: Request, res: Response) {
  return successResponse(res, { message: 'Logged out successfully' });
}

export async function meHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Not authenticated.');
    }
    const user = await getUserById(req.user.userId);
    if (!user) {
      throw ApiError.notFound('User account not found.');
    }
    return successResponse(res, user);
  } catch (error) {
    next(error);
  }
}

export async function updateProfileHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Not authenticated.');
    }
    const updated = await updateUserProfile(req.user.userId, req.body);
    return successResponse(res, updated);
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      throw ApiError.badRequest('Email and new password are required.');
    }
    await resetPassword(email, newPassword);
    return successResponse(res, { message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
}

export async function demoPersonasHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const personas = await getDemoPersonas();
    return successResponse(res, personas);
  } catch (error) {
    next(error);
  }
}
