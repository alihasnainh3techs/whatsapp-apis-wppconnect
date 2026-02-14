import { WhatsAppService } from '../services/whatsapp.service.js';
import { DevicesRepository } from '../repositories/devices.repo.js';
import { APIResponse } from '../utils/api-response.js';
import { APIError } from '../utils/api-error.js';

class AuthController {
    constructor() {
        this.whatsappService = new WhatsAppService();
        this.devicesRepository = new DevicesRepository();
    }

    getQrCode = async (req, res) => {
        const { id } = req.params;

        const isSessionActive = this.whatsappService.sessions.has(id);
        if (isSessionActive) {
            return res.status(400).json(new APIError(400, 'Session is already active.'));
        }

        await this.whatsappService.connectDevice(id);

        res.status(200).json(new APIResponse(201, 'QR code generation started.'));
    };

    getCode = async (req, res) => {
        const { id } = req.params;
        const { phone } = req.body;

        const isSessionActive = this.whatsappService.sessions.has(id);
        if (isSessionActive) {
            return res.status(400).json(new APIError(400, 'Session is already active.'));
        }

        await this.whatsappService.connectDevice(id, phone);

        res.status(200).json(new APIResponse(201, 'Code generation started.'));
    };

    startAllSessions = async (req, res) => {
        const devices = await this.devicesRepository.getAllDevices();
        if (!devices || devices.length === 0) {
            return res
                .status(404)
                .json(new APIError(404, 'No sessions found to start.'));
        }

        await Promise.all(
            devices.map(async (device) => {
                const isSessionActive = this.whatsappService.sessions.has(device.sessionId);
                if (!isSessionActive) {
                    await this.whatsappService.connectDevice(device.sessionId);
                }
            })
        );

        res.status(200).json(new APIResponse(200, 'All sessions started successfully.'));
    };

    showAllSessions = async (req, res) => {
        const devices = await this.devicesRepository.getAllDevices();
        res.status(200).json(new APIResponse(200, 'All sessions retrieved successfully.', devices));
    };
}

export default new AuthController();
