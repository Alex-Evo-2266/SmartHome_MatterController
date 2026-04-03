// src/matter/device/handlers/OnOffHandler.ts

import { OnOff } from "@matter/main/clusters";
import { ClusterClientObj } from "@matter/main/protocol";
import { ClusterHandlerMeta, ClusterHandlerMetaCB, IClusterHandler } from "./IClusterHandler.js";
import { ICommands } from "./ICommands.js";

export const OnOffHandlerMeta: ClusterHandlerMetaCB = async(nodeId, endpointId) => {
  console.log("u0",nodeId, endpointId)
  return{
    name: `state_${endpointId}`,
    commands: ["on", "off", "toggle", "set", "get"],
    attributes: ["onOff"],
    nodeId,
    endpointId
  }
}

export class OnOffHandler implements IClusterHandler {
  name = "onOff";

  constructor(
    private client: ClusterClientObj<OnOff.Complete>,
    private publish: Function,
    private publishState: Function,
    private meta: ClusterHandlerMeta
  ) {}

  async init() {
    const state = await this.client.getOnOffAttribute();

    this.publishState()


    this.client.addOnOffAttributeListener((value) => {
        this.publishState()
    });
  }

  async getState(){
    const state = await this.client.getOnOffAttribute();
    return {[this.meta.name]: state}
  }

  canHandle(cmd: ICommands) {
    console.log(cmd.type, this.meta.name)
    return cmd.type === this.meta.name
    // return cmd.type === this.name;
  }

  async execute(cmd: ICommands) {
    if (cmd.action === "toggle"){
      await this.client.toggle();
      return
    } 
    if (cmd.action === "on") {
      await this.client.on();
      return
    } 
    if (cmd.action === "off") {
      await this.client.off();
      return
    } 
    if (cmd.action === "set"){
      const curstate = await this.client.getOnOffAttribute();
      if(!curstate && (cmd.value === "true" || cmd.value === true || cmd.value === 1 || cmd.value === "1"))
      {
        await this.client.on();
      }
      if(curstate && (cmd.value === "false" || cmd.value === false || cmd.value === 0 || cmd.value === "0"))
      {
        await this.client.off();
      }
      return
    }
    if(cmd.action === "get"){
      const curstate = await this.client.getOnOffAttribute();
      this.publish(`matter/devices/${this.meta.nodeId}`, {
          state: { [this.meta.name]: curstate },
      });
      return
    }
  }
}