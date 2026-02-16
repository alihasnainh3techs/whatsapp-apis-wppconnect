import whatsappService from '../services/whatsapp.service.js';
import devicesRepo from '../repositories/devices.repo.js';
import { APIResponse } from '../utils/api-response.js';
import { APIError } from '../utils/api-error.js';

class AuthController {
  getQrCode = async (req, res) => {
    const { id } = req.params;

    const isSessionActive = whatsappService.sessions.has(id);
    if (isSessionActive) {
      return res
        .status(400)
        .json(new APIError(400, 'Session is already active.'));
    }

    const response = await whatsappService.connectDevice(id);

    res.status(200).json(new APIResponse(201, 'QR code generation started.', response));
  };

  getCode = async (req, res) => {
    const { id } = req.params;
    const { phone } = req.body;

    const isSessionActive = whatsappService.sessions.has(id);
    if (isSessionActive) {
      return res
        .status(400)
        .json(new APIError(400, 'Session is already active.'));
    }

    const response = await whatsappService.connectDevice(id, phone);

    res.status(200).json(new APIResponse(201, 'Code generation started.', response));
  };

  startAllSessions = async (req, res) => {
    const devices = await devicesRepo.getAllDevices();
    if (!devices || devices.length === 0) {
      return res
        .status(404)
        .json(new APIError(404, 'No sessions found to start.'));
    }

    await Promise.all(
      devices.map(async (device) => {
        const isSessionActive = whatsappService.sessions.has(
          device.sessionId,
        );
        if (!isSessionActive) {
          await whatsappService.connectDevice(device.sessionId);
        }
      }),
    );

    res
      .status(200)
      .json(new APIResponse(200, 'All sessions started successfully.'));
  };

  showAllSessions = async (req, res) => {
    const devices = await devicesRepo.getAllDevices();
    res
      .status(200)
      .json(
        new APIResponse(200, 'All sessions retrieved successfully.', devices),
      );
  };
}

export default new AuthController();
