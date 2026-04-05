// src/matter/MqttTransport.ts
import { connect, MqttClient } from "mqtt";
import { ITransport } from "../types/Transport.js";

type MessageCallback = (msg: any, topic: string) => void;

function jsonReplacer(key: string, value: unknown) {
  return typeof value === "bigint" ? value.toString() : value;
}

export class MqttTransport implements ITransport {
  private client?: MqttClient = undefined;
  private subscriptions: Map<string, MessageCallback> = new Map();

  constructor(
    private baseTopik: string,
    private url: string,
    private userName: string,
    private userPassword: string
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
        // const cb = this.subscriptions.get(topic);
        // if (!cb) return;

        let msg: any;
        try {
          msg = JSON.parse(payload.toString());
        } catch (e) {
          console.warn(`[MQTT] Invalid JSON on topic ${this.baseTopik}/${topic}`);
          return;
        }
        // 🔹 ищем подписку с wildcard
        for (const [sub, cb] of this.subscriptions.entries()) {
          const regex = new RegExp("^" + sub.replace("+", "[^/]+").replace("#", ".+") + "$");
          if (regex.test(topic)) {
            const t = topic.split('/').slice(1).join('/')
            cb(msg, t);
          }
        }

        // cb(msg, topic);
      });
    });
  }

  async disconnect(): Promise<void> {
    if (!this.client) return;

    return new Promise((resolve) => {
      console.log("[MQTT] Disconnecting...");

      // 🔹 удалить все listeners
      this.client?.removeAllListeners("message");
      this.client?.removeAllListeners("connect");
      this.client?.removeAllListeners("error");

      // 🔹 отписаться от всех топиков
      const topics = Array.from(this.subscriptions.keys());

      if (topics.length > 0) {
        this.client?.unsubscribe(topics, () => {
          this.cleanup(resolve);
        });
      } else {
        this.cleanup(resolve);
      }
    });
  }

  private cleanup(resolve: () => void) {
    this.client?.end(true, () => {
      console.log("[MQTT] Disconnected");

      this.client = undefined;
      this.subscriptions.clear();

      resolve();
    });
  }

  // 🔹 публикация
  async publish(topic: string, message: unknown) {
    const payload = JSON.stringify(message, jsonReplacer);
    this.client?.publish(`${this.baseTopik}/${topic}`, payload, { qos: 0 }, (err) => {
      if (err) console.error("[MQTT] Publish error:", err);
    });
  }

  // 🔹 подписка
  async subscribe(topic: string, cb: MessageCallback) {
    this.subscriptions.set(`${this.baseTopik}/${topic}`, cb);
    this.client?.subscribe(`${this.baseTopik}/${topic}`, { qos: 0 }, (err) => {
      if (err) console.error("[MQTT] Subscribe error:", err);
      else console.log(`[MQTT] Subscribed to ${`${this.baseTopik}/${topic}`}`);
    });
  }
}