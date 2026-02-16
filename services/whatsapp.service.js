import wppconnect from '@wppconnect-team/wppconnect';
import devicesRepo from '../repositories/devices.repo.js';

class WhatsAppService {
    constructor() {
        this.sessions = new Map();
    }

    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }

    async deleteSession(sessionId) {
        const client = this.sessions.get(sessionId);
        if (client) await client.close();
    }

    buildConfig(phone, resolve) {
        if (phone) {
            return {
                phoneNumber: phone,
                catchLinkCode: (str) => {
                    console.log('Code: ' + str);

                    resolve({
                        code: str
                    });
                },
            };
        }

        return {
            catchQR: (base64Qrimg, asciiQR, attempts, urlCode) => {
                console.log('Number of attempts to read the qrcode: ', attempts);
                console.log('Terminal qrcode: ', asciiQR);
                console.log('base64 image string qrcode: ', base64Qrimg);
                console.log('urlCode (data-ref): ', urlCode);

                resolve({
                    qrCode: base64Qrimg, // Send this base64 string to your frontend
                    attempts
                });
            },
        };
    }

    async connectDevice(sessionId, phone = null) {
        return new Promise((resolve, reject) => {
            const config = this.buildConfig(phone, resolve);

            wppconnect.create({
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

                        if (statusSession === 'disconnectedMobile') {
                            await this.deleteSession(sessionId);
                        }

                        this.sessions.delete(sessionId);
                    }

                    await devicesRepo.updateDeviceSession(sessionId, {
                        status: status,
                        disconnectReason: disconnectReason,
                        lastDisconnectedAt: lastDisconnectedAt,
                    });
                },
                logQR: true,
            }).then((client) => {
                this.sessions.set(sessionId, client);

                resolve({});

                client.onPollResponse(
                    ({ chatId, msgId, selectedOptions, sender, timestamp }) => { },
                );
            }).catch(async (error) => {
                console.error('Error generating QR code:', error);
                await devicesRepo.updateDeviceSession(sessionId, {
                    status: 'FAILED',
                    lastDisconnectedAt: new Date(),
                });
                reject(error);
            });
        })
    }
}

export default new WhatsAppService();