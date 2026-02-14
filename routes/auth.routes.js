import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.route('/:id/qrcode-session').get(asyncHandler(authController.getQrCode));
router.route('/:id/code-session').post(asyncHandler(authController.getCode));
router
    .route('/show-all-sessions')
    .get(asyncHandler(authController.showAllSessions));
router.route('/start-all').get(asyncHandler(authController.startAllSessions));

export default router;
