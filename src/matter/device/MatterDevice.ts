// src/matter/device/MatterDevice.ts

import { IClusterHandler } from "./handlers/IClusterHandler.js";

export class MatterDevice {
  constructor(
    public nodeId: bigint,
    public endpointId: number,
    private handlers: IClusterHandler[]
  ) {}

  async init() {
    for (const h of this.handlers) {
      await h.init();
    }
  }

  async execute(command: any) {
    for (const h of this.handlers) {
      if (h.canHandle(command)) {
        return h.execute(command);
      }
    }
  }

  getCapabilities() {
    return this.handlers.map(h => h.name);
  }
}