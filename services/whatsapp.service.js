import wppconnect from '@wppconnect-team/wppconnect';
import { DevicesRepository } from '../repositories/devices.repo.js';

export class WhatsAppService {
    constructor() {
        this.sessions = new Map();
        this.devicesRepository = new DevicesRepository();
    }

    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }

    buildConfig(phone) {
        if (phone) {
            return {
                phoneNumber: phone,
                catchLinkCode: (str) => console.log('Code: ' + str),
            };
        }

        return {
            catchQR: (base64Qrimg, asciiQR, attempts, urlCode) => {
                console.log('Number of attempts to read the qrcode: ', attempts);
                console.log('Terminal qrcode: ', asciiQR);
                console.log('base64 image string qrcode: ', base64Qrimg);
                console.log('urlCode (data-ref): ', urlCode);
            },
        };
    }

    async connectDevice(sessionId, phone = null) {
        const config = this.buildConfig(phone);

        try {
            const client = await wppconnect.create({
                session: sessionId,
                ...config,
                puppeteerOptions: {
                    userDataDir: `./tokens/${sessionId}`,
                },
                statusFind: async (statusSession, session) => {
                    console.log('Status Session: ', statusSession); //return isLogged || notLogged || browserClose || qrReadSuccess || qrReadFail || autocloseCalled || desconnectedMobile || deleteToken
                    //Create session wss return "serverClose" case server for close
                    console.log('Session name: ', session);

                    let status;
                    let disconnectReason = null;
                    let lastDisconnectedAt = null;

                    if (
                        statusSession === 'isLogged' ||
                        statusSession === 'qrReadSuccess'
                    ) {
                        status = 'CONNECTED';
                    } else {
                        status = 'DISCONNECTED';
                        disconnectReason = statusSession;
                        lastDisconnectedAt = new Date();
                    }

                    await this.devicesRepository.updateDeviceSession(sessionId, {
                        status: status,
                        disconnectReason: disconnectReason,
                        lastDisconnectedAt: lastDisconnectedAt,
                    });
                },
                logQR: true,
            });

            this.sessions.set(sessionId, client);

            client.onPollResponse(
                ({ chatId, msgId, selectedOptions, sender, timestamp }) => { },
            );

            return client;
        } catch (error) {
            console.error('Error generating QR code:', error);
            this.devicesRepository.updateDeviceSession(sessionId, {
                status: 'FAILED',
                lastDisconnectedAt: new Date(),
            });
            throw error;
        }
    }
}
