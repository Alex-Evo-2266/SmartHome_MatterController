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
      const s = await this.matter.getNodesDetails()
      await this.transport.publish(`matter/devices/details`, {data: s});
    });

    await this.transport.subscribe("matter/devices/+/getInfo", async (_: any, topic: string) => {
      const match = topic.match(/matter\/devices\/(\d+)\/info/);
      if (!match) return;

      const nodeId = BigInt(match[1]);

      const info = await this.nodeManager.getDeviceInfo(nodeId);

      await this.transport.publish(`matter/devices/${nodeId}/info`, {
        nodeId,
        info,
      });
    });

    await this.transport.subscribe("matter/devices/+/get", async (_: any, topic: string) => {
      const match = topic.match(/matter\/devices\/(\d+)\/get/);
      if (!match) return;

      const nodeId = BigInt(match[1]);

      await this.nodeManager.publicState(nodeId)
    });

    await this.transport.subscribe("matter/devices/+/set", async (msg: any, topic: string) => {
      const match = topic.match(/matter\/devices\/(\d+)\/set/);
      if (!match) return;

      const nodeId = BigInt(match[1]);

      await this.nodeManager.set(nodeId, msg);
    });


    await this.transport.subscribe("matter/devices/+/command", async (msg: any, topic: string) => {
      const match = topic.match(/matter\/devices\/(\d+)\/command/);
      if (!match) return;

      const nodeId = BigInt(match[1]);

      await this.nodeManager.execute(nodeId, msg);
    });

  }
}