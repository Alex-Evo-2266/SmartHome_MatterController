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
		type: "number",
		nodeId,
		endpointId
	}
}

export class LevelControlHandler implements IClusterHandler {
	private currentLevel: number = 0;
	public meta: ClusterHandlerMeta;

	constructor(
		private client: ClusterClientObj<LevelControl.Complete>,
		private publish: Function,
		private publishState: Function,
		meta: ClusterHandlerMeta,
	) {
		this.meta = meta
	}

	async init() {
		await this.loadNewData()
		this.publishState()

		this.client.addCurrentLevelAttributeListener(async(value) => {
			if(value ===null) return
			this.currentLevel = value
			this.publishState()
		});
	}

	async loadNewData() {
		const curLevel = await this.client.getCurrentLevelAttribute();
		if(curLevel !== null)
			this.currentLevel = curLevel
	}

	async getState(){
		return {[this.meta.name]: this.currentLevel}
	}

	canHandle(cmd: ICommands) {
		return cmd.name === this.meta.name
	}


	async execute(cmd: ICommands) {
		const options = {
			executeIfOff: false,
			coupleColorTempToLevel: false
		};

		try{
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
			} else if (cmd.action === "get") {
				await this.loadNewData()
				this.publishState()
			}
		}
		catch(e){
			console.error(e)
		}
	}
}