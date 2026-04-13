// src/matter/initMatterEnvironment.ts
import { Environment, StorageService, singleton } from "@matter/main";
import { Ble } from "@matter/main/protocol";
import { NodeJsBle } from "@matter/nodejs-ble";
import { Config } from "../config/type.js";

export async function initMatterEnvironment(config: Config) {
  const environment = Environment.default;

  // 🔹 1. задаём storage path (как CLI --storage-path)
  environment.vars.set("storage.path", config.matter.storagePath ?? "./config/matter-storage");

  console.log("[Matter] Storage path:", config.matter.storagePath ?? "./config/matter-storage");

    // 👇 ВОТ ЭТО КЛЮЧ
  environment.vars.set("net.interface", config.wifi.networkInterface ?? "wlp1s0");

  // 🔹 2. BLE
  if (config.ble.enabled) {
    environment.vars.set("ble", true);
    // environment.vars.set("ble.hci.id", config.ble.hciId);

    Ble.get = singleton(
      () =>
        new NodeJsBle({
          environment,
          hciId: config.ble.hciId,
        }),
    );

    console.log(`[Matter] BLE enabled (hciId=${config.ble.hciId})`);
  }

    const storage = environment.get(StorageService);

    console.log("Storage location:", storage.location);

  return environment;
}