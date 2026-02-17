import mediaService from '../services/media.service.js';
import { APIResponse } from '../utils/api-response.js';

class MediaController {
  imageMessage = async (req, res) => {
    const { id, number, caption, viewOnce } = req.body;
    const media = req.file;

    const result = await mediaService.sendImageMessage(
      id,
      number,
      caption,
      viewOnce,
      media,
    );

    res
      .status(200)
      .json(new APIResponse(200, 'Image message sent successfully.', result));
  };
}

export default new MediaController();
