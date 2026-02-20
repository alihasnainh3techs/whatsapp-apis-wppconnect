import wppconnect from '@wppconnect-team/wppconnect';
import devicesRepo from '../repositories/devices.repo.js';
import webhookService from './webhook.service.js';

class WhatsAppService {
  constructor() {
    this.sessions = new Map();
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  async deleteSession(sessionId) {
    const client = this.sessions.get(sessionId);
    if (!client) return;

    try {
      await client.close().catch(() => { });
      this.sessions.delete(sessionId);
    } catch (err) {
      console.error('Delete session failed:', err);
      throw err;
    }
  }

  buildConfig(phone, resolve) {
    if (phone) {
      return {
        phoneNumber: phone,
        catchLinkCode: (str) => {
          console.log('Code: ' + str);

          resolve({
            code: str,
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
          attempts,
        });
      },
    };
  }

  async connectDevice(sessionId, phone = null) {
    return new Promise((resolve, reject) => {
      const config = this.buildConfig(phone, resolve);

      wppconnect
        .create({
          session: sessionId,
          whatsappVersion: '2.3000.1032521188-alpha',
          ...config,
          puppeteerOptions: {
            userDataDir: `./tokens/${sessionId}`,
            args: ['--no-sandbox'],
          },
          statusFind: async (statusSession, session) => {
            console.log('Status Session: ', statusSession); //return isLogged || notLogged || browserClose || qrReadSuccess || qrReadFail || autocloseCalled || desconnectedMobile || deleteToken
            //Create session wss return "serverClose" case server for close
            console.log('Session name: ', session);

            const client = this.getSession(sessionId);

            const wid = await client?.getWid();
            const phone = wid?.split('@')[0];

            let status;
            let disconnectReason = null;
            let lastDisconnectedAt = null;

            if (
              statusSession === 'isLogged' ||
              statusSession === 'qrReadSuccess' ||
              statusSession === 'inChat'
            ) {
              status = 'CONNECTED';

              await webhookService.emit('device.connected', {
                sessionId,
                phone,
                status,
              });
            } else {
              status = 'DISCONNECTED';
              disconnectReason = statusSession;
              lastDisconnectedAt = new Date();

              await webhookService.emit('device.disconnected', {
                sessionId,
                phone,
                status,
                disconnectReason,
                lastDisconnectedAt,
              });

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
        })
        .then(async (client) => {
          this.sessions.set(sessionId, client);

          client.onMessage(async (message) => {
            if (message.type !== 'list_response') return;

            const phoneNumber = message.from.split('@')[0];
            const selectedData = message.listResponse;

            const res = await webhookService.emit('list.response', {
              sessionId,
              phoneNumber: phoneNumber,
              content: message.content,
              selectedData: selectedData,
              timestamp: message.timestamp,
            });

            if (res && res.reply) {
              await client.sendText(message.from, res.reply);
            }
          });

          client.onPollResponse(async (pollResponse) => {
            const phoneNumber = pollResponse.sender.split('@')[0];

            const validSelections = pollResponse.selectedOptions
              .filter((option) => option !== null)
              .map((option) => ({
                name: option.name,
                localId: option.localId,
              }));

            const res = await webhookService.emit('poll.response', {
              sessionId,
              phoneNumber: phoneNumber,
              selections: validSelections,
              timestamp: pollResponse.timestamp,
            });

            if (res && res.reply) {
              await client.sendText(pollResponse.sender, res.reply);
            }
          });

          const wid = await client.getWid();
          const phone = wid.split('@')[0];

          await devicesRepo.updateDeviceSession(sessionId, {
            phone,
          });

          resolve({});
        })
        .catch(async (error) => {
          console.error('Error generating QR code:', error);
          await devicesRepo.updateDeviceSession(sessionId, {
            status: 'FAILED',
            lastDisconnectedAt: new Date(),
          });
          reject(error);
        });
    });
  }
}

export default new WhatsAppService();
