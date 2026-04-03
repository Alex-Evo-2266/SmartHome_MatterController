// src/matter/device/ClusterRegistry.ts

import { ColorControl, LevelControl, OnOff } from "@matter/main/clusters";
import { OnOffHandler, OnOffHandlerMeta } from "./handlers/OnOffHandler.js";
import { LevelControlHandler, LevelControlHandlerMeta } from "./handlers/LevelControlHandler.js";
import { ColorControlHandlerMeta, ColorTemperatureHandler } from "./handlers/ColorTemperatureHandler.js";
import { ClusterHandlerMeta, ClusterHandlerMetaCB, IClusterHandler } from "./handlers/IClusterHandler.js";

type Ictx = {
    nodeId: bigint
    endpointId: number
    publish: Function
    publishState: Function
}

type HandlerConstructor = new (client: any, publish: Function, publishState: Function, meta: any) => IClusterHandler;

type IClusterRegistry = {
    cluster: any,
    meta: ClusterHandlerMetaCB,
    create: (client: any, ctx: Ictx) => Promise<IClusterHandler>
}[]

const createHandler = (Class: HandlerConstructor, meta: ClusterHandlerMetaCB | ClusterHandlerMeta) => ({
    meta: async (nodeId, endpointId, client) => typeof(meta) === 'function'? await meta(nodeId, endpointId, client): meta,
    create: async (client: any, ctx:Ictx) =>{
        console.log(ctx.nodeId, ctx.endpointId, client)
        return new Class(client, ctx.publish, ctx.publishState, typeof(meta) === 'function'? await meta(ctx.nodeId, ctx.endpointId, client): meta)
    }
})
    

export const ClusterRegistry: IClusterRegistry = [
  {
    cluster: OnOff.Complete,
    ...createHandler(OnOffHandler, OnOffHandlerMeta) 
    // create: async (client, ctx) =>
    //     new OnOffHandler(client, ctx.publish, await OnOffHandlerMeta(ctx.nodeId, ctx.endpointId, client)),
  },
  {
    cluster: LevelControl.Complete,
    ...createHandler(LevelControlHandler, LevelControlHandlerMeta)
    // create: async (client, ctx) =>
    //     new LevelControlHandler(client, ctx.publish, await LevelControlHandlerMeta(ctx.nodeId, ctx.endpointId, client)),
  },
  {
    cluster: ColorControl.Cluster,
    ...createHandler(ColorTemperatureHandler, ColorControlHandlerMeta)
    // create: async (client, ctx) => 
    //     new ColorTemperatureHandler(client, ctx.publish, await ColorControlHandlerMeta())
  }

];