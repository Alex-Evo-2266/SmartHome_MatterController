// config/ConfigService.ts
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { Config } from "./type.js";

export class ConfigService {
  private config: Config;
  private filePath: string;

  constructor(filePath: string = "./config/config.yml") {
    this.filePath = path.resolve(filePath);
    this.config = this.load();
  }

  private load(): Config {
    if (!fs.existsSync(this.filePath)) {
      throw new Error(`Config file not found: ${this.filePath}`);
    }

    const file = fs.readFileSync(this.filePath, "utf-8");
    return yaml.load(file) as Config;
  }

  private save() {
    const yamlStr = yaml.dump(this.config);
    fs.writeFileSync(this.filePath, yamlStr, "utf-8");
  }

  // 🔹 Получить весь конфиг
  get(): Config {
    return this.config;
  }

  // 🔹 Получить часть конфига
  getKey<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }

  // 🔹 Обновить часть (например wifi)
  update<K extends keyof Config>(key: K, value: Partial<Config[K]>) {
    this.config[key] = {
      ...this.config[key],
      ...value,
    };

    this.save();
  }

  // 🔹 Полная перезапись
  set(newConfig: Config) {
    this.config = newConfig;
    this.save();
  }

  // 🔹 Перезагрузка с диска
  reload() {
    this.config = this.load();
  }
}