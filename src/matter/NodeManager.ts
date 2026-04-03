// src/matter/NodeManager.ts
import { Command, NodeId } from "@matter/main/types";
import { MatterController } from "./MatterController.js";
import { ITransport } from "../types/Transport.js";
import { PairedNode } from "@project-chip/matter.js/device";
import { createDevice } from "./device/createDevice.js";
import { MatterDevice } from "./device/MatterDevice.js";
import { ICommands } from "./device/handlers/ICommands.js";
import { ClusterRegistry } from "./device/ClusterRegistry.js";

export class NodeManager {
    private nodes = new Map<bigint, PairedNode>();
    private devices = new Map<string, MatterDevice>();
    private nodesData = new Map<bigint, Record<string, any>>();

  constructor(
    private matter: MatterController,
    private transport: ITransport,
  ) {}

  // 🔹 Подключение и подписка
  async initNode(nodeId: bigint) {
    const node = await this.matter.connectNode(NodeId(nodeId));

    this.nodes.set(nodeId, node);

    this.subscribeToEvents(nodeId, node);

    const devices = node.getDevices();


    for (const dev of devices) {
      const device = await createDevice(
        nodeId,
        dev,
        this.transport.publish.bind(this.transport),
        async () => await this.publicState(nodeId)
      );

      await device.init();

      this.devices.set(`${nodeId}-${dev.number}`, device);

      // 🔹 snapshot
      await this.transport.publish("matter/events/device", {
        nodeId,
        endpointId: dev.number,
        capabilities: device.getCapabilities(),
      });
    }
  }

  // 🔹 Подписка на ВСЕ события
  private subscribeToEvents(nodeId: bigint, node: PairedNode) {
    node.events.attributeChanged.on((data: any) => {
      this.transport.publish("matter/events/attribute", {
        nodeId,
        ...data,
      });
    });

    node.events.eventTriggered.on((data: any) => {
      this.transport.publish("matter/events/event", {
        nodeId,
        ...data,
      });
    });

    node.events.stateChanged.on((state: any) => {
      this.transport.publish("matter/events/state", {
        nodeId,
        state,
      });
    });

    node.events.structureChanged.on(() => {
      this.transport.publish("matter/events/structure", {
        nodeId,
      });
    });
  }

  async execute(nodeId: bigint, endpointId: number, command: ICommands) {
    console.log(this.devices)
    const device = this.devices.get(`${nodeId}-${endpointId}`);
    if (!device) return;
    console.log(device)

    await device.execute(command);
  }

  async set(nodeId: bigint, data: Record<string, any>) {
    const node = this.nodes.get(nodeId)
    if (!node) return null;
    const devices = node.getDevices();
    for (const device of devices){
      for (const reg of ClusterRegistry) {
        const client = device.getClusterClient(reg.cluster);
        if(!client)continue
        const meta = await reg.meta(nodeId, device.number ?? 0, client)
        if(meta.name in data && meta.commands.includes("set")){
          const endpoint = this.devices.get(`${nodeId}-${device.number}`)
          if(!endpoint)continue
          await endpoint.execute({type: meta.name, action: "set", value: data[meta.name]});
        }
      }
    }
  }

  async getDeviceInfo(nodeId: bigint) {
    const node = this.nodes.get(nodeId);
    if (!node) return null;

    const devices = node.getDevices();
    const result: any[] = [];

    for (const device of devices) {
      const deviceInfo: any = {
        endpointId: device.number,
        clusters: [],
      };

      for (const reg of ClusterRegistry) {
        const client = device.getClusterClient(reg.cluster);
        const meta = await reg.meta(nodeId, device.number ?? 0, client)
        if (client) {
          deviceInfo.clusters.push({
            clusterName: reg.cluster.name,
            name: meta.name,
            Commands: meta.commands,
            attributes: meta.attributes,
            commandsInMatter: Object.keys(reg.cluster.commands || {}),
            attributesInMatter: Object.keys(reg.cluster.attributes || {}),
          });
        }
      }

      result.push(deviceInfo);
    }

    return result;
  }

  async publicState(nodeId: bigint){
    const data = await this.getState(nodeId)
    this.transport.publish(`matter/devices/${nodeId.toString()}`, data)
  }


  async getState(nodeId: bigint){
    const data:Record<string, any> = {}
    const node = this.nodes.get(nodeId)
    if (!node) return null;
    const devices = node.getDevices();
    for (const device of devices){
      const endpoint = this.devices.get(`${nodeId}-${device.number}`)
      if(!endpoint)continue
      for(const [k,v] of Object.entries(await endpoint.getState())){
        data[k] = v
      }
    }
    return data
  }
}