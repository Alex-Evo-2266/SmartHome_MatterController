// src/matter/device/handlers/OnOffHandler.ts

import { OnOff } from "@matter/main/clusters";
import { ClusterClientObj } from "@matter/main/protocol";
import { IClusterHandler } from "./IClusterHandler.js";

export class OnOffHandler implements IClusterHandler {
  name = "onOff";

  constructor(
    private client: ClusterClientObj<OnOff.Complete>,
    private publish: Function,
    private meta: { nodeId: bigint; endpointId: number }
  ) {}

  async init() {
    const state = await this.client.getOnOffAttribute();

    this.publish("matter/events/device", {
      ...this.meta,
      capability: this.name,
      state: { on: state },
    });

    this.client.addOnOffAttributeListener((value) => {
      this.publish("matter/events/device", {
        ...this.meta,
        capability: this.name,
        state: { on: value },
      });
    });
  }

  canHandle(cmd: any) {
    return cmd.type === "onOff";
  }

  async execute(cmd: any) {
    if (cmd.action === "toggle") return this.client.toggle();
    if (cmd.action === "on") return this.client.on();
    if (cmd.action === "off") return this.client.off();
  }
}