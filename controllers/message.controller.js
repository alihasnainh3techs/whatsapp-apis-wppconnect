import { APIResponse } from '../utils/api-response.js';
import { MessageService } from '../services/message.service.js';

class MessageController {
  constructor() {
    this.messageService = new MessageService();
  }

  textMessage = async (req, res) => {
    const { id, number, message } = req.body;

    const result = await this.messageService.sendText(id, number, message);

    res
      .status(200)
      .json(new APIResponse(200, 'Message sent successfully.', result));
  };

  locationMessage = async (req, res) => {
    const { id, number, location, name, address } = req.body;

    const result = await this.messageService.sendLocation(
      id,
      number,
      location,
      name,
      address,
    );

    res
      .status(200)
      .json(new APIResponse(200, 'Location sent successfully.', result));
  };

  contactMessage = async (req, res) => {
    const { id, to, name, phone } = req.body;

    const result = await this.messageService.sendContact(id, to, name, phone);

    res
      .status(200)
      .json(new APIResponse(200, 'Contact sent successfully.', result));
  };

  pollMessage = async (req, res) => {
    const { id, number, poll, values, selectableCount } = req.body;

    const result = await messageService.sendPoll(
      id,
      number,
      poll,
      values,
      selectableCount,
    );

    res
      .status(200)
      .json(new APIResponse(200, 'Poll sent successfully.', result));
  };
}

export default new MessageController();
