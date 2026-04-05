// src/bridge/MatterMqttBridge.ts

import { checkCommand, checkRecord } from "../helpers/check.js";
import { MatterController } from "../matter/MatterController.js";
import { NodeManager } from "../matter/NodeManager.js";
import { ITransport } from "../types/Transport.js";


export class MatterMqttBridge {

  constructor(
    private transport: ITransport,
    private matter: MatterController,
    private nodeManager: NodeManager,
    private restart: Function
  ) {}

  async start() {
    await this.transport.connect();
    await this.matter.init();

    await this.restoreNodes();
    await this.setupSubscriptions();
  }

  private async publicError(message:string, detail:unknown = undefined) {
    this.transport.publish("event/errors", {message, type: "Error", detail})
  }

  // 🔥 восстановление после рестарта
  private async restoreNodes() {
    const nodes = this.matter.getNodes();

    for (const nodeId of nodes) {
      try{
        console.log(nodeId, BigInt(nodeId))
        await this.nodeManager.initNode(BigInt(nodeId));
      }
      catch{
        console.error("error connect")
        this.publicError("error connect")
      }
    }
  }

  private async setupSubscriptions() {
    // 🔹 pairing
    await this.transport.subscribe("pair", async (msg) => {
      if(!msg || typeof msg !== 'object' || !("pairingCode" in msg) || typeof msg.pairingCode !== "string")return
      try{
        const nodeId = await this.matter.commission(msg.pairingCode);
        
        await this.nodeManager.initNode(BigInt(nodeId));

      }
      catch(e){
        this.publicError("error connect", String(e))
      }
    });

    await this.transport.subscribe("delete", async (msg) => {
      if(!msg || typeof msg !== 'object' || !("nodeId" in msg) || typeof msg.nodeId !== "string")return

      await this.nodeManager.removeNode(msg.nodeId);
    });

    await this.transport.subscribe("system/restart", async () => {
      console.log("📩 Restart command received");
      await this.restart();
    })

    await this.transport.subscribe("devices/get", async () => {
      const s = await this.matter.getNodesDetails()
      await this.transport.publish(`devices/details`, {data: s});
    });

    await this.transport.subscribe("devices/+/getInfo", async (_: any, topic: string) => {
      const match = topic.match(/devices\/(\d+)\/getInfo/);
      if (!match) return;

      const nodeId = BigInt(match[1]);

      const info = await this.nodeManager.getDeviceInfo(nodeId);

      await this.transport.publish(`devices/${nodeId}/info`, {
        nodeId,
        info,
      });
    });

    await this.transport.subscribe("devices/+/get", async (_, topic: string) => {
      const match = topic.match(/devices\/(\d+)\/get/);
      if (!match) return;

      const nodeId = BigInt(match[1]);

      await this.nodeManager.publicState(nodeId)
    });

    await this.transport.subscribe("devices/+/set", async (msg: unknown, topic: string) => {
      const match = topic.match(/devices\/(\d+)\/set/);
      if (!match) return;

      const nodeId = BigInt(match[1]);
      if(!checkRecord(msg))return

      await this.nodeManager.set(nodeId, msg);
    });


    await this.transport.subscribe("devices/+/command", async (msg: unknown, topic: string) => {
      const match = topic.match(/devices\/(\d+)\/command/);
      if (!match) return;

      const nodeId = BigInt(match[1]);
      if(!checkCommand(msg))return
      await this.nodeManager.execute(nodeId, msg);
    });

  }
}