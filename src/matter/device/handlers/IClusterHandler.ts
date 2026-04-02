// src/matter/device/handlers/IClusterHandler.ts

export interface IClusterHandler {
  name: string;

  init(): Promise<void>;

  canHandle(command: any): boolean;

  execute(command: any): Promise<void>;
}