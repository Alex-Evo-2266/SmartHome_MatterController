// src/matter/device/handlers/OnOffHandler.ts

import { LevelControl } from "@matter/main/clusters";
import { ClusterClientObj } from "@matter/main/protocol";
import { ClusterHandlerMeta, ClusterHandlerMetaCB, IClusterHandler } from "./IClusterHandler.js";
import { ICommands } from "./ICommands.js";
import { nodeId } from "@matter/main/model";

export const LevelControlHandlerMeta: ClusterHandlerMetaCB = async (nodeId, endpointId, client) => {
    const min = await client.getMinLevelAttribute?.();
    const max = await client.getMaxLevelAttribute?.();
    return{
        name: `level_${endpointId}`,
        commands: ["set", "up", "down", "stop", "get"],
        attributes: ["currentLevel"],
        max,
        min,
        nodeId,
        endpointId
    }
}

export class LevelControlHandler implements IClusterHandler {
  name = "levelControl";

  private currentLevel: number = 0;

  constructor(
    private client: ClusterClientObj<LevelControl.Complete>,
    private publish: Function,
    private publishState: Function,
    private meta: ClusterHandlerMeta
  ) {}

  async init() {
    const curLevel = await this.client.getCurrentLevelAttribute();
    if(curLevel !== null)
        this.currentLevel = curLevel

    this.publishState()

    this.client.addCurrentLevelAttributeListener((value) => {
      this.publishState()
    });
  }

    async getState(){
        const state = await this.client.getCurrentLevelAttribute();
        return {[this.meta.name]: state}
    }

  canHandle(cmd: ICommands) {
    return cmd.type === this.meta.name
    // return cmd.type === this.name;
  }


    async execute(cmd: any) {
        const options = {
        executeIfOff: false,
        coupleColorTempToLevel: false
        };

        if (cmd.action === "set" && typeof cmd.value === "number") {
        this.currentLevel = cmd.value;
        await this.client.moveToLevel({
            level: cmd.value,
            transitionTime: 0,
            optionsMask: options,
            optionsOverride: options
        });
        } else if (cmd.action === "up") {
            await this.client.move({
                moveMode: 0, // up
                rate: (typeof cmd.value === "number")? cmd.value: 1,
                optionsMask: options,
                optionsOverride: options
            });
        } else if (cmd.action === "down") {
            await this.client.move({
                moveMode: 1, // down
                rate: (typeof cmd.value === "number")? cmd.value: 1,
                optionsMask: options,
                optionsOverride: options
            });
        } else if (cmd.action === "stop") {
            await this.client.stop({
                optionsMask: options,
                optionsOverride: options
            });
        }

        const curLevel = await this.client.getCurrentLevelAttribute();
        if(curLevel !== null)
            this.currentLevel = curLevel
        this.publishState()

    }
}