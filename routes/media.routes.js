import { uploadImage } from '../middlewares/multer.js';
import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import mediaController from '../controllers/media.controller.js';

const router = Router();

router.post(
  '/image',
  uploadImage.single('media'),
  asyncHandler(mediaController.imageMessage),
);

export default router;
