// src/matter/device/createDevice.ts

import { ClusterRegistry } from "./ClusterRegistry.js";
import { IClusterHandler } from "./handlers/IClusterHandler.js";
import { MatterDevice } from "./MatterDevice.js";

export async function createDevice(nodeId: bigint, device: any, publish: Function, publishState: Function) {
  const handlers: IClusterHandler[] = [];

  for (const reg of ClusterRegistry) {
    const client = device.getClusterClient(reg.cluster);

    if (client) {
      handlers.push(
        await reg.create(client, {
          publishState,
          publish,
          nodeId,
          endpointId: device.number
        })
      );
    }
  }

  return new MatterDevice(nodeId, device.number, handlers);
}