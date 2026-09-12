import { Request, Response, NextFunction } from 'express';
import {
  getCustomersSummary,
  getCustomerProfileService,
  updateCustomerProfileService,
} from '../services/customer.service.js';
import { sendSuccess } from '../utils/response.js';

export async function getCustomersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customers = await getCustomersSummary();
    return sendSuccess(res, customers);
  } catch (err) {
    next(err);
  }
}

export async function getCustomerByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = String(req.params.customerId);
    const customer = await getCustomerProfileService(customerId);
    return sendSuccess(res, customer);
  } catch (err) {
    next(err);
  }
}

export async function updateCustomerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = String(req.params.customerId);
    const updated = await updateCustomerProfileService(customerId, req.body);
    return sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}
