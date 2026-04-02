// src/index.ts
import { MatterMqttBridge } from "./bridge/MatterMqttBridge.js";
import { initMatterEnvironment } from "./matter/initMatterEnvironment.js";
import { MatterController } from "./matter/MatterController.js";
import { NodeManager } from "./matter/NodeManager.js";
import { MqttTransport } from "./transport/MqttTransport.js";


(async () => {
  const env = await initMatterEnvironment();
  const controller = new MatterController(env);
  // await controller.init();

  const transport = new MqttTransport();
  const nodeManager = new NodeManager(controller, transport);

  await transport.connect();

  const bridge = new MatterMqttBridge(transport, controller, nodeManager);
  await bridge.start(); // Подписка на топики pair, device/commands
})();