import axios from "axios";

class WebhookService {
    async emit(event, payload) {
        try {
            await axios.post(process.env.WEBHOOK_URL, {
                event,
                data: payload
            })
        } catch (error) {
            console.error('Webhook error:', error.message);
        }
    }
}

export default new WebhookService();