import wppconnect from '@wppconnect-team/wppconnect';
import devicesRepo from '../repositories/devices.repo.js';
import webhookService from './webhook.service.js';

class WhatsAppService {
  constructor() {
    this.sessions = new Map();
  }

  getSession(sessionId) {
    console.log("Client: ", this.sessions);

    return this.sessions.get(sessionId);
  }

  async deleteSession(sessionId) {
    const client = this.sessions.get(sessionId);
    if (client) {
      try { await client.close(); } catch (e) { }
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
              statusSession === 'qrReadSuccess'
            ) {
              status = 'CONNECTED';

              await webhookService.emit("device.connected", {
                sessionId,
                phone,
                status
              })

            } else {
              status = 'DISCONNECTED';
              disconnectReason = statusSession;
              lastDisconnectedAt = new Date();

              await webhookService.emit("device.disconnected", {
                sessionId,
                phone,
                status,
                disconnectReason,
                lastDisconnectedAt
              })

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

            console.log("Something happening");

            if (message.type !== "list_response") return;

            console.log("From: ", message.from);
            console.log("Id: ", message.id);

            console.log("Formated Name: ", message.sender.formattedName);
            console.log("Push Name: ", message.sender.pushname);
            console.log("Name: ", message.sender.name);
            console.log("Short Name: ", message.sender.shortName);


            console.log("Content: ", JSON.stringify(message.content));
            console.log("List response", JSON.stringify(message.listResponse));

            await client.sendText(phone, `Thanks! You chose:`);
          })

          client.onPollResponse(async (message) => {
            console.log("Poll response: ", message);
          });

          const wid = await client.getWid();
          const phone = wid.split('@')[0];

          await devicesRepo.updateDeviceSession(sessionId, {
            phone,
          });

          console.log("Client: ", this.sessions);

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
