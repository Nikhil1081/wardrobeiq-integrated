import { Router } from 'express';
import {
  generateOutfitHandler,
  replaceOutfitSlotHandler,
  shuffleOutfitHandler,
  getSavedOutfitsHandler,
  saveOutfitHandler,
  deleteSavedOutfitHandler,
} from '../../controllers/outfit.controller.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import {
  OutfitGenerateSchema,
  OutfitReplaceSchema,
  OutfitShuffleSchema,
  SavedOutfitCreateSchema,
  CustomerIdParamSchema,
} from '../../validation/schemas.js';

const router = Router();

router.post('/generate', validateBody(OutfitGenerateSchema), generateOutfitHandler);
router.post('/replace', validateBody(OutfitReplaceSchema), replaceOutfitSlotHandler);
router.post('/shuffle', validateBody(OutfitShuffleSchema), shuffleOutfitHandler);

// Saved outfits routes
router.get('/saved/:customerId', validateParams(CustomerIdParamSchema), getSavedOutfitsHandler);
router.post('/saved/:customerId', validateParams(CustomerIdParamSchema), validateBody(SavedOutfitCreateSchema), saveOutfitHandler);
router.delete('/saved/:customerId/:outfitId', deleteSavedOutfitHandler);

export default router;
