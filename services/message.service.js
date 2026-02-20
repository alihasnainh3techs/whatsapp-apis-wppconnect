import whatsappService from './whatsapp.service.js';

class MessageService {
  async sendText(sessionId, number, message) {
    const client = whatsappService.getSession(sessionId);
    if (!client) {
      throw new Error(`Session ${sessionId} is not active or connected`);
    }
    const chatId = number.replace(/\D+/g, '') + '@c.us';

    return await client.sendText(chatId, message);
  }

  async sendLocation(sessionId, number, location, name = '', address = '') {
    const client = whatsappService.getSession(sessionId);
    if (!client) {
      throw new Error(`Session ${sessionId} is not active or connected`);
    }
    const chatId = number.replace(/\D+/g, '') + '@c.us';

    return await client.sendLocation(chatId, {
      lat: location.lat,
      lng: location.lng,
      name: name,
      address: address,
    });
  }

  async sendContact(sessionId, to, name, phone) {
    const client = whatsappService.getSession(sessionId);
    if (!client) {
      throw new Error(`Session ${sessionId} is not active or connected`);
    }
    const chatId = to.replace(/\D+/g, '') + '@c.us';
    const contactsId = phone.replace(/\D+/g, '') + '@c.us';

    return await client.sendContactVcard(chatId, contactsId, name);
  }

  async sendPoll(sessionId, number, name, choices, selectableCount) {
    const client = whatsappService.getSession(sessionId);
    if (!client) {
      throw new Error(`Session ${sessionId} is not active or connected`);
    }

    const chatId = number.replace(/\D+/g, '') + '@c.us';

    return await client.sendPollMessage(chatId, name, choices, {
      selectableCount: selectableCount,
    });
  }

  async sendList(
    sessionId,
    number,
    buttonText,
    description,
    title = '',
    footer = '',
    sections,
  ) {
    const client = whatsappService.getSession(sessionId);
    if (!client) {
      throw new Error(`Session ${sessionId} is not active or connected`);
    }

    const chatId = number.replace(/\D+/g, '') + '@c.us';

    const data = {
      buttonText: buttonText,
      description: description,
      title: title,
      footer: footer,
      sections: sections,
    };

    return await client.sendListMessage(chatId, { ...data });
  }
}

export default new MessageService();
