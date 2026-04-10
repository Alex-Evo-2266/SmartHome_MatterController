// src/matter/device/handlers/OnOffHandler.ts

import { OnOff } from "@matter/main/clusters";
import { ClusterClientObj } from "@matter/main/protocol";
import { ClusterHandlerMeta, ClusterHandlerMetaCB, IClusterHandler } from "./IClusterHandler.js";
import { ICommands } from "./ICommands.js";

export const OnOffHandlerMeta: ClusterHandlerMetaCB = async(nodeId, endpointId) => {
  return{
    name: `power_${endpointId}`,
    commands: ["on", "off", "toggle", "set", "get"],
    attributes: [`power_${endpointId}`],
    type: "binary",
    nodeId,
    endpointId
  }
}

export class OnOffHandler implements IClusterHandler {
  private currentState: boolean = false;
  public meta: ClusterHandlerMeta;

  constructor(
    private client: ClusterClientObj<OnOff.Complete>,
    private publish: Function,
    private publishState: Function,
    meta: ClusterHandlerMeta,
  ) {
    this.meta = meta
  }

  async init() {
    await this.loadNewData()
    this.publishState()


    this.client.addOnOffAttributeListener(async(value) => {
      this.currentState = value
      this.publishState()
    });
  }


  async loadNewData() {
    const state = await this.client.getOnOffAttribute();
    this.currentState = state
  }

  async getState(){
    return {[this.meta.name]: this.currentState}
  }

  canHandle(cmd: ICommands) {
    return this.meta.attributes.includes(cmd.attribute)
  }

  async execute(cmd: ICommands) {
    try{
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
        await this.loadNewData()
        this.publishState()
        return
      }
    }
    catch(e){
      console.error(e)
    }
  }
}