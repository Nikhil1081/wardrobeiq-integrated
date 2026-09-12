import { Request, Response, NextFunction } from 'express';
import {
  generateOutfitService,
  replaceOutfitSlotService,
  shuffleOutfitService,
  getSavedOutfitsService,
  saveOutfitService,
  deleteSavedOutfitService,
} from '../services/outfit.service.js';
import { generateWeatherOutfit } from '../tools/weatherOutfitEngine.js';
import { sendSuccess } from '../utils/response.js';

export async function getTodayOutfitHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = (req.params.customerId || req.query.customerId || req.body.customerId || 'C001') as string;
    const city = (req.query.city || req.body.city) as string | undefined;
    const occasion = (req.query.occasion || req.body.occasion || 'casual') as string;
    const preset = (req.query.preset || req.body.preset) as string | undefined;

    const result = await generateWeatherOutfit({
      customerId,
      city,
      occasion,
      preset,
    });

    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function generateOutfitHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { customerId, occasion, season, budget, style, lockedItems } = req.body;
    const outfit = await generateOutfitService(customerId, occasion, season, budget, style, lockedItems);
    return sendSuccess(res, outfit, 201);
  } catch (err) {
    next(err);
  }
}

export async function replaceOutfitSlotHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { customerId, outfit, currentOutfit, slot, slotToReplace, preferences } = req.body;
    const targetOutfit = outfit || currentOutfit;
    const targetSlot = slot || slotToReplace;
    const result = await replaceOutfitSlotService(customerId, targetOutfit, targetSlot, preferences);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function shuffleOutfitHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { customerId, occasion, season, budget, style, lockedItems, currentOutfit, outfit } = req.body;
    const targetOutfit = currentOutfit || outfit;
    const outfitResult = await shuffleOutfitService(
      customerId,
      occasion || targetOutfit?.occasion || 'casual',
      season || targetOutfit?.season || 'all-season',
      budget || targetOutfit?.totalCost,
      style,
      lockedItems || targetOutfit?.items?.filter((i: any) => i.locked) || [],
      targetOutfit
    );
    return sendSuccess(res, outfitResult);
  } catch (err) {
    next(err);
  }
}

export async function getSavedOutfitsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = String(req.params.customerId);
    const outfits = await getSavedOutfitsService(customerId);
    return sendSuccess(res, outfits);
  } catch (err) {
    next(err);
  }
}

export async function saveOutfitHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = String(req.params.customerId);
    const { occasion, items, caption } = req.body;
    const saved = await saveOutfitService(customerId, occasion, items, caption);
    return sendSuccess(res, saved, 201);
  } catch (err) {
    next(err);
  }
}

export async function deleteSavedOutfitHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = String(req.params.customerId);
    const outfitId = String(req.params.outfitId);
    const success = await deleteSavedOutfitService(customerId, outfitId);
    return sendSuccess(res, { success });
  } catch (err) {
    next(err);
  }
}
