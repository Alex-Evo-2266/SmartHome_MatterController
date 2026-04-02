// src/matter/NodeManager.ts
import { NodeId } from "@matter/main/types";
import { OnOff } from "@matter/main/clusters";
import { ClusterClientObj } from "@matter/main/protocol";
import { MatterController } from "./MatterController.js";
import { ITransport } from "../types/Transport.js";
import { PairedNode } from "@project-chip/matter.js/device";

export class NodeManager {
  private nodes = new Map<bigint, any>();

  constructor(
    private matter: MatterController,
    private transport: ITransport
  ) {}

  // 🔹 Подключение и подписка
  async initNode(nodeId: bigint) {
    console.log(`[Node] connect ... ${nodeId}`);
    
    const node = await this.matter.connectNode(NodeId(nodeId));

    this.nodes.set(nodeId, node);

    console.log(`[Node] connected ${nodeId}`);

    this.subscribeToEvents(nodeId, node);

    await this.setupOnOff(nodeId, node);
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

  // 🔥 OnOff (первый реальный девайс)
  private async setupOnOff(nodeId: bigint, node: any) {
    const devices = node.getDevices();

    if (!devices.length) return;

    const onOff: ClusterClientObj<OnOff.Complete> | undefined =
      devices[0].getClusterClient(OnOff.Complete);

    if (!onOff) return;

    console.log(`[Node ${nodeId}] OnOff detected`);

    // 🔹 initial state
    let state = await onOff.getOnOffAttribute();

    await this.transport.publish("matter/events/device", {
      nodeId,
      type: "light",
      state: { on: state },
    });

    // 🔹 подписка
    onOff.addOnOffAttributeListener((value) => {
      state = value;

      this.transport.publish("matter/events/device", {
        nodeId,
        type: "light",
        state: { on: value },
      });
    });
  }

  // 🔹 Toggle
  async toggle(nodeId: bigint) {
    const node: PairedNode = this.nodes.get(nodeId);
    if (!node) return;

    const devices = node.getDevices();

    const onOff: ClusterClientObj<OnOff.Complete> | undefined =
      devices[0]?.getClusterClient(OnOff.Complete);

    if (onOff) {
      await onOff.toggle();
    }
  }
}