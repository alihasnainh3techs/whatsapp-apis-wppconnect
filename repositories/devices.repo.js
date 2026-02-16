import { Device } from '../models/device.modal.js';

export class DevicesRepository {
  async getDeviceBySessionId(sessionId) {
    return await Device.findOne({ sessionId });
  }

  async updateDeviceSession(sessionId, sessionData) {
    return await Device.updateOne(
      { sessionId },
      { $set: { ...sessionData } },
      { upsert: true },
    );
  }

  async getAllDevices() {
    return await Device.find({});
  }
}
