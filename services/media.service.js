import whatsappService from "./whatsapp.service.js";
import fs from "fs/promises";

class MediaService {
    async sendImageMessage(sessionId, number, caption = "", viewOnce = false, media) {
        const isViewOnce = Boolean(viewOnce);

        const client = whatsappService.getSession(sessionId);
        if (!client) {
            throw new Error(`Session ${sessionId} is not active or connected`);
        }
        const chatId = number.replace(/\D+/g, '') + '@c.us';

        const result = await client.sendImage(chatId, media?.path, null, caption, null, isViewOnce);

        await fs.unlink(media?.path);

        return result;
    }
}

export default new MediaService();