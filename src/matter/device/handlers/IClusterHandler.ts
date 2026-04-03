// src/matter/device/handlers/IClusterHandler.ts

export interface IClusterHandler {

  meta: ClusterHandlerMeta

  init(): Promise<void>;

  canHandle(command: any): boolean;

  getState(): Promise<Record<string, any>>

  execute(command: any): Promise<void>;
}

export interface ClusterHandlerMeta {
  name: string;
  type: string;
  commands: string[];
  attributes: string[];
  min?: number;
  max?: number;
  nodeId: bigint; 
  endpointId: number;
}

export type ClusterHandlerMetaCB = (nodeId: bigint, endpointId: number, client: any) => Promise<ClusterHandlerMeta>
