// // src/index.ts
// import { MatterMqttBridge } from "./bridge/MatterMqttBridge.js";
// import { ConfigService } from "./config/ConfigService.js";
// import { initMatterEnvironment } from "./matter/initMatterEnvironment.js";
// import { MatterController } from "./matter/MatterController.js";
// import { NodeManager } from "./matter/NodeManager.js";
// import { MqttTransport } from "./transport/MqttTransport.js";


// (async () => {
//   const configService = new ConfigService();
//   const config = configService.get()

//   const env = await initMatterEnvironment(config);
//   const controller = new MatterController(env, config);
//   // await controller.init();

//   const transport = new MqttTransport(config.mqtt.baseTopik, config.mqtt.url, config.mqtt.user, config.mqtt.password);
//   const nodeManager = new NodeManager(controller, transport);

//   // await transport.connect();

//   const bridge = new MatterMqttBridge(transport, controller, nodeManager);
//   await bridge.start(); // Подписка на топики pair, device/commands
// })();

// src/index.ts
import { MatterMqttBridge } from "./bridge/MatterMqttBridge.js";
import { ConfigService } from "./config/ConfigService.js";
import { initMatterEnvironment } from "./matter/initMatterEnvironment.js";
import { MatterController } from "./matter/MatterController.js";
import { NodeManager } from "./matter/NodeManager.js";
import { MqttTransport } from "./transport/MqttTransport.js";

class App {
  private configService = new ConfigService();

  private transport?: MqttTransport;
  private controller?: MatterController;
  private nodeManager?: NodeManager;
  private bridge?: MatterMqttBridge;

  private restarting = false;

  async start() {
    const config = this.configService.get();

    const env = await initMatterEnvironment(config);

    this.controller = new MatterController(env, config);

    this.transport = new MqttTransport(
      config.mqtt.baseTopik,
      config.mqtt.url,
      config.mqtt.user,
      config.mqtt.password
    );

    this.nodeManager = new NodeManager(this.controller, this.transport);

    this.bridge = new MatterMqttBridge(
      this.transport,
      this.controller,
      this.nodeManager,
      this.restart.bind(this)
    );

    await this.bridge.start();

    console.log("🚀 App started");
  }

  async stop() {
    console.log("🛑 Stopping app...");

    await this.transport?.disconnect?.();
    await this.controller?.shutdown()

    this.bridge = undefined;
    this.transport = undefined;
    this.controller = undefined;
    this.nodeManager = undefined;
  }

  async restart() {
    if (this.restarting) return;

    this.restarting = true;

    console.log("🔄 Restarting...");

    try {
      await this.stop();
      await this.start();
      console.log("✅ Restart done");
    } catch (e) {
      console.error("❌ Restart failed:", e);
    } finally {
      this.restarting = false;
    }
  }
}

// 🚀 запуск
const app = new App();
app.start();