// src/bridge/MatterMqttBridge.ts

import { idAsBigInt } from "../helpers/bigIntConvert.js";
import { MatterController } from "../matter/MatterController.js";
import { NodeManager } from "../matter/NodeManager.js";
import { ITransport } from "../types/Transport.js";


export class MatterMqttBridge {

  constructor(
    private transport: ITransport,
    private matter: MatterController,
    private nodeManager: NodeManager
  ) {}

  async start() {
    await this.transport.connect();
    await this.matter.init();

    await this.restoreNodes();
    await this.setupSubscriptions();
  }

  // 🔥 восстановление после рестарта
  private async restoreNodes() {
    const nodes = this.matter.getNodes();

    for (const nodeId of nodes) {
      try{
        console.log(nodeId, BigInt(nodeId))
        await this.nodeManager.initNode(BigInt(nodeId));
      }
      catch{console.error("error connect")}
    }
  }

  private async setupSubscriptions() {
    // 🔹 pairing
    await this.transport.subscribe("matter/pair", async (msg: any) => {
      console.log(msg)
      const nodeId = await this.matter.commission(msg.pairingCode);

      console.log(`nodeId = ${nodeId}`)
      await this.nodeManager.initNode(BigInt(nodeId));
    });

    await this.transport.subscribe("matter/devices/get", async (msg: any) => {
      console.log(await this.matter.getNodes())
      const s = await this.matter.getNodesDetails()
      console.log(s[0].deviceData?.basicInformation)
    });

    // 🔹 toggle
    await this.transport.subscribe("matter/device/toggle", async (msg: any) => {
      await this.nodeManager.toggle(idAsBigInt(msg.nodeId));
    });
  }
}