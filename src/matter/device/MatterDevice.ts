// src/matter/device/MatterDevice.ts

import { IClusterHandler } from "./handlers/IClusterHandler.js";
import { ICommands } from "./handlers/ICommands.js";

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

  async execute(command: ICommands) {
    for (const h of this.handlers) {
        console.log("i0", command)
        if (h.canHandle(command)) {
            console.log("i1", command)
            return h.execute(command);
        }
    }
  }

  async getState() {
    const data: Record<string, any> = {}
    for (const h of this.handlers) {
        for(const [k, v] of Object.entries(await h.getState())){
            data[k]=v
        }
    }
    return data
  }

  getCapabilities() {
    return this.handlers.map(h => h.name);
  }
}