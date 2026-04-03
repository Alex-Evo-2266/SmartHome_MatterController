import { ColorControl } from "@matter/main/clusters";
import { ClusterClientObj } from "@matter/main/protocol";
import { ClusterHandlerMeta, ClusterHandlerMetaCB, IClusterHandler } from "./IClusterHandler.js";
import { ICommands } from "./ICommands.js";

const toKelvin = (mired: number) => Math.round(1000000 / mired);

export const ColorControlHandlerMeta: ClusterHandlerMetaCB = async (nodeId, endpointId, client) => {
    const min = await client.getColorTempPhysicalMaxMiredsAttribute?.()
    const max = await client.getColorTempPhysicalMinMiredsAttribute?.()

    const minK = min ? toKelvin(min) : undefined;
    const maxK = max ? toKelvin(max) : undefined;
  return{
    name: `temp_${endpointId}`,
    commands: ["set", "get"],
    attributes: ["currentTemp"],
    max: maxK,
    min: minK,
    nodeId,
    endpointId
  }
}

export class ColorTemperatureHandler implements IClusterHandler {
  private currentTemp = 2700;
  public meta: ClusterHandlerMeta;

  constructor(
    private client: ClusterClientObj<ColorControl.Complete>,
    private publish: Function,
    private publishState: Function,
    meta: ClusterHandlerMeta,
  ) {
    this.meta=meta
  }

  async init() {
    const curLevel = await this.client.getColorTemperatureMiredsAttribute();
    if(curLevel !== null && curLevel !== undefined)
        this.currentTemp = toKelvin(curLevel)
    this.publishState();

    this.client.addColorTemperatureMiredsAttributeListener((value: number) => {
      this.currentTemp = toKelvin(value);
      this.publishState();
    });
  }

  async getState(){
      return {[this.meta.name]: this.currentTemp}
  }

  canHandle(cmd: ICommands) {
    return cmd.name === this.meta.name
    // return cmd.type === this.name;
  }

  async execute(cmd: ICommands) {
    try{
      if (cmd.action === "set" && typeof cmd.value === "number") {
        const mired = Math.round(1000000 / cmd.value); // K -> mired
        const options = { executeIfOff: false, coupleColorTempToLevel: false };
        await this.client.moveToColorTemperature({
          colorTemperatureMireds: mired,
          transitionTime: 0,
          optionsMask: options,
          optionsOverride: options
        });

        this.currentTemp = cmd.value;
        this.publishState();
      }
      else if(cmd.action === "get") {
        this.publishState();
      }
    }
    catch(e){
      console.log(e)
    }
  }
}