// src/matter/MqttTransport.ts
import { connect, MqttClient } from "mqtt";
import { config } from "../config.js";
import { ITransport } from "../types/Transport.js";

type MessageCallback = (msg: any) => void;

function jsonReplacer(key: string, value: any) {
  return typeof value === "bigint" ? value.toString() : value;
}

export class MqttTransport implements ITransport {
  private client?: MqttClient = undefined;
  private subscriptions: Map<string, MessageCallback> = new Map();

  constructor(
    private url: string = config.mqtt.url,
    private userName: string = config.mqtt.user,
    private userPassword: string = config.mqtt.password
  ) {}

  // 🔹 подключение
  async connect() {
    return new Promise<void>((resolve, reject) => {
      console.log(this)
      this.client = connect(this.url, {username: this.userName, password: this.userPassword});

      this.client.on("connect", () => {
        console.log(`[MQTT] Connected to ${this.url}`);
        resolve();
      });

      this.client.on("error", (err) => {
        console.error("[MQTT] Connection error:", err);
        reject(err);
      });

      // 🔹 обработка сообщений
      this.client.on("message", (topic, payload) => {
        const cb = this.subscriptions.get(topic);
        if (!cb) return;

        let msg: any;
        try {
          msg = JSON.parse(payload.toString());
        } catch (e) {
          console.warn(`[MQTT] Invalid JSON on topic ${topic}`);
          return;
        }

        cb(msg);
      });
    });
  }



  // 🔹 публикация
  async publish(topic: string, message: any) {
    const payload = JSON.stringify(message, jsonReplacer);
    this.client?.publish(topic, payload, { qos: 0 }, (err) => {
      if (err) console.error("[MQTT] Publish error:", err);
    });
  }

  // 🔹 подписка
  async subscribe(topic: string, cb: MessageCallback) {
    this.subscriptions.set(topic, cb);
    this.client?.subscribe(topic, { qos: 0 }, (err) => {
      if (err) console.error("[MQTT] Subscribe error:", err);
      else console.log(`[MQTT] Subscribed to ${topic}`);
    });
  }
}