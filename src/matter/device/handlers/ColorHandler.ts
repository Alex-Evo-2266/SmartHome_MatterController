import { ColorControl } from "@matter/main/clusters";
import { ClusterClientObj } from "@matter/main/protocol";
import { ClusterHandlerMeta, ClusterHandlerMetaCB, IClusterHandler } from "./IClusterHandler.js";
import { ICommands } from "./ICommands.js";
import { checkColor } from "../../../helpers/check.js";
import { hexToMatterHS } from "../../../helpers/color.js";

const toKelvin = (mired: number) => Math.round(1000000 / mired);

export const ColorControlHandlerMeta: ClusterHandlerMetaCB = async (nodeId, endpointId, client) => {
  const attributes: string[] = [];

  const featureMap = await client.getFeatureMapAttribute?.() ?? 0;

  const hasTemp = featureMap?.colorTemperature ?? false;
  const hasColor = featureMap?.hueSaturation ?? false;

  let minK: number | undefined;
  let maxK: number | undefined;

  if (hasTemp) {
    attributes.push(`temp_${endpointId}`);

    const min = await client.getColorTempPhysicalMaxMiredsAttribute?.();
    const max = await client.getColorTempPhysicalMinMiredsAttribute?.();

    minK = min ? toKelvin(min) : undefined;
    maxK = max ? toKelvin(max) : undefined;
  }

  if (hasColor) {
    attributes.push(`color_${endpointId}`);
  }

  return {
    name: `color_${endpointId}`,
    commands: ["set", "get"],
    attributes,
    max: maxK,
    min: minK,
    type: "number",
    nodeId,
    endpointId
  };
};

export class ColorHandler implements IClusterHandler {
  private state = {
    temp: 2700,
    hue: 0,
    saturation: 0,
  };
  public meta: ClusterHandlerMeta;

  public hasTemp?: boolean
  public hasColor?: boolean

  constructor(
    private client: ClusterClientObj<ColorControl.Complete>,
    private publish: Function,
    private publishState: Function,
    meta: ClusterHandlerMeta,
  ) {
    this.meta=meta
  }

  async init() {
    await this.loadNewData();
    this.publishState();

    const featureMap = await this.client.getFeatureMapAttribute?.() ?? 0;

    this.hasTemp = featureMap?.colorTemperature ?? false;
    this.hasColor = featureMap?.hueSaturation ?? false;



    if (this.hasTemp) {
      this.client.addColorTemperatureMiredsAttributeListener((v) => {
        this.state.temp = toKelvin(v);
        this.publishState();
      });
    }

    if (this.hasColor) {
      this.client.addCurrentHueAttributeListener((v) => {
        this.state.hue = v;
        this.publishState();
      });
    }

    if (this.hasColor) {
      this.client.addCurrentSaturationAttributeListener((v) => {
        this.state.saturation = v;
        this.publishState();
      });
    }
  }

  async loadNewData() {

    if (this.hasTemp) {
      const temp = await this.client.getColorTemperatureMiredsAttribute();
      if (temp != null) this.state.temp = toKelvin(temp);
    }

    if (this.hasColor) {
      const hue = await this.client.getCurrentHueAttribute();
      if (hue !== undefined) this.state.hue = hue;
    }

    if (this.hasColor) {
      const sat = await this.client.getCurrentSaturationAttribute();
      if (sat !== undefined) this.state.saturation = sat;
    }
  }

  async getState() {
    const data = {}
    if(this.hasTemp){
      data[`temp_${this.meta.endpointId}`] = this.state.temp
    }
    if(this.hasColor){
      data[`color_${this.meta.endpointId}`] = {
        hue: this.state.hue,
        saturation: this.state.saturation,
      }
    };
    return data
  }

  canHandle(cmd: ICommands) {
    return this.meta.attributes.includes(cmd.attribute)
  }

  async execute(cmd: ICommands) {
    const options = { executeIfOff: false, coupleColorTempToLevel: false };
    try{
      if (cmd.attribute === `temp_${this.meta.endpointId}`){
        if (cmd.action === "set" && typeof cmd.value === "number") {
          const mired = Math.round(1000000 / cmd.value); // K -> mired
          await this.client.moveToColorTemperature({
            colorTemperatureMireds: mired,
            transitionTime: 0,
            optionsMask: options,
            optionsOverride: options
          });

          this.state.temp = cmd.value;
          this.publishState();
        }
        else if(cmd.action === "get") {
          await this.loadNewData()
          this.publishState();
        }
      }
      else if(cmd.attribute === `color_${this.meta.endpointId}`){
        if (cmd.action === "set") {
          if (typeof cmd.value === 'string')
          {
            const { hue, saturation } = hexToMatterHS(cmd.value);

            if (hue !== undefined && saturation !== undefined) {
              await this.client.moveToHueAndSaturation({
                hue,
                saturation,
                transitionTime: 0,
                optionsMask: options,
                optionsOverride: options
              });

              this.state.hue = hue;
              this.state.saturation = saturation;

              this.publishState();
            }
          }
          else if (typeof cmd.value === "object" && checkColor(cmd.value)){
            const { hue, saturation } = cmd.value;

            if (hue !== undefined && saturation !== undefined) {
              await this.client.moveToHueAndSaturation({
                hue,
                saturation,
                transitionTime: 0,
                optionsMask: options,
                optionsOverride: options
              });

              this.state.hue = hue;
              this.state.saturation = saturation;

              this.publishState();
            }
          }
        }
        else if (cmd.action === "get") {
          await this.loadNewData();
          this.publishState();
        }
      }
    }
    catch(e){
      console.log(e)
    }
  }
}