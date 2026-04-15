// src/matter/MatterController.ts
import {
  Diagnostic,
  Environment,
  Logger,
  StorageService,
  Time,
} from "@matter/main";

import {
  CommissioningController,
  NodeCommissioningOptions,
} from "@project-chip/matter.js";

import {
  ManualPairingCodeCodec,
  NodeId,
} from "@matter/main/types";

import { GeneralCommissioning } from "@matter/main/clusters";
import { Config } from "../config/type.js";

const logger = Logger.get("MatterController");

export class MatterController {
  private controller!: CommissioningController;
  private storageService: StorageService;
  private config: Config

  private uniqueId!: string;
  private fabricLabel!: string;

  constructor(private environment: Environment, config: Config) {
    this.storageService = environment.get(StorageService);
    this.config = config
  }

  // 🔹 INIT (как CLI блок "Collect all needed data")
  async init() {
    const controllerStorage = (await this.storageService.open("controller"))
      .createContext("data");

    // 🔸 uniqueId
    this.uniqueId = await controllerStorage.get(
      "uniqueid",
      Time.nowMs().toString()
    );
    await controllerStorage.set("uniqueid", this.uniqueId);

    // 🔸 fabricLabel
    this.fabricLabel = await controllerStorage.get(
      "fabriclabel",
      this.config.matter.fabricLabel
    );
    await controllerStorage.set("fabriclabel", this.fabricLabel);

    // 🔥 создаём controller
    this.controller = new CommissioningController({
      environment: {
        environment: this.environment,
        id: this.uniqueId,
      },
      autoConnect: false,
      adminFabricLabel: this.fabricLabel,
    });

    await this.controller.start();

    logger.info("Controller started");
  }

  // 🔹 Commission (pairingCode + BLE + WiFi)
  async commission(pairingCode: string) {
    logger.info("pairingCode", pairingCode)
    const codec = ManualPairingCodeCodec.decode(pairingCode);

    logger.debug("Pairing data:", Diagnostic.json(codec));

    // 🔸 commissioning options (как в CLI)
    const commissioningOptions: NodeCommissioningOptions["commissioning"] = {
      regulatoryLocation:
        GeneralCommissioning.RegulatoryLocationType.IndoorOutdoor,
      regulatoryCountryCode: "RU",
    };

    // 💥 WiFi (ВАЖНО для BLE)
    if (this.config.wifi.ssid && this.config.wifi.password) {
      commissioningOptions.wifiNetwork = {
        wifiSsid: this.config.wifi.ssid,
        wifiCredentials: this.config.wifi.password,
      };

      logger.info(`Using WiFi: ${this.config.wifi.ssid}`);
    }

    const options: NodeCommissioningOptions = {
      commissioning: commissioningOptions,

      discovery: {
        identifierData: {
          shortDiscriminator: codec.shortDiscriminator,
        },

        discoveryCapabilities: {
          ble: this.config.ble.enabled, // 💥 ключевая строка
          onIpNetwork: true
        },
      },

      passcode: codec.passcode,
    };

    logger.info("Commissioning...", Diagnostic.json(options));

    const nodeId = await this.controller.commissionNode(options);

    logger.info(`Commissioned nodeId=${nodeId}`);

    return nodeId;
  }

  async shutdown() {
    logger.info("Shutting down MatterController...");

    try {
      const nodes = this.getNodes();

      for (const nodeId of nodes) {
        try {
          const node = await this.getNode(nodeId);

          if (node?.isConnected) {
            node.disconnect();
          }
        } catch (e) {
          logger.warn(`Error disconnecting node ${nodeId}:`, e);
        }
      }

      await this.controller?.close?.();

      logger.info("MatterController stopped");
    } catch (e) {
      logger.error("Shutdown error:", e);
    }
  }

  async removeNode(nodeId: NodeId) {

    try {
      const node = await this.getNode(nodeId);
      // 🔹 убедиться что подключены
      if (node && !node.isConnected) {
        await node.connect();
      }

      // 🔹 сначала удаление с устройства
      await this.controller.removeNode(nodeId);

          // 🔹 только ПОСЛЕ этого disconnect
      if (node?.isConnected) {
        node.disconnect();
      }

      logger.info(`Removed nodeId=${nodeId}`);

    } catch (e) {
      logger.warn(`Decommission failed, removing locally`, e);
    }


  }

  // 🔹 Получить все ноды
  getNodes(): NodeId[] {
    return this.controller.getCommissionedNodes();
  }

  // 🔹 Детали нод (как в CLI)
  getNodesDetails() {
    return this.controller.getCommissionedNodesDetails();
  }

  // 🔹 Получить node instance
  async getNode(nodeId: NodeId) {
    return this.controller.getNode(nodeId);
  }

  // 🔹 Подключение (ВАЖНО)
  async connectNode(nodeId: NodeId) {
    const node = await this.getNode(nodeId);
    if (!node.isConnected) {
      node.connect();
    }

    if (!node.initialized) {
      await node.events.initialized;
    }

    return node;
  }

  // 🔹 Debug (как node.logStructure())
  async logNode(nodeId: NodeId) {
    const node = await this.connectNode(nodeId);
    node.logStructure();
  }
}