// src/matter/device/ClusterRegistry.ts

import { ColorControl, LevelControl, OnOff } from "@matter/main/clusters";
import { OnOffHandler, OnOffHandlerMeta } from "./handlers/OnOffHandler.js";
import { LevelControlHandler, LevelControlHandlerMeta } from "./handlers/LevelControlHandler.js";
import { ColorControlHandlerMeta, ColorHandler } from "./handlers/ColorHandler.js";
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
        return new Class(client, ctx.publish, ctx.publishState, typeof(meta) === 'function'? await meta(ctx.nodeId, ctx.endpointId, client): meta)
    }
})
    

export const ClusterRegistry: IClusterRegistry = [
  {
    cluster: OnOff.Complete,
    ...createHandler(OnOffHandler, OnOffHandlerMeta)
  },
  {
    cluster: LevelControl.Complete,
    ...createHandler(LevelControlHandler, LevelControlHandlerMeta)
  },
  {
    cluster: ColorControl.Cluster,
    ...createHandler(ColorHandler, ColorControlHandlerMeta)
  },

];