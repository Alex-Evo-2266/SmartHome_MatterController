import mqtt, { MqttClient, IClientOptions } from "mqtt";

interface MQTTOptions {
  host?: string;               // хост брокера, например "localhost"
  port?: number;               // порт, например 1883
  clientId?: string;           // идентификатор клиента
  username?: string;
  password?: string;
  topic?: string;              // топик по умолчанию
  isDebug?: boolean;
  reconnectInterval?: number;  // ms
}

export class MQTT {
  private client: MqttClient | null = null;

  private host: string;
  private port: number;
  private clientId: string;
  private username?: string;
  private password?: string;
  private topic: string;
  private isDebug: boolean;
  private reconnectInterval: number;

  private onMessage: (topic: string, message: string) => void = () => {};

  constructor(options: MQTTOptions = {}) {
    this.host = options.host ?? "localhost";
    this.port = options.port ?? 1883;
    this.clientId = options.clientId ?? `mqtt-${Math.random().toString(16).slice(2, 8)}`;
    this.username = options.username;
    this.password = options.password;
    this.topic = options.topic ?? "#";
    this.isDebug = options.isDebug ?? false;
    this.reconnectInterval = options.reconnectInterval ?? 3000;
  }

  setMessageHandler(cb: (topic: string, message: string) => void) {
    this.onMessage = cb;
  }

  connect() {
    const url = `mqtt://${this.host}:${this.port}`;
    const options: IClientOptions = {
      clientId: this.clientId,
      username: this.username,
      password: this.password,
      reconnectPeriod: this.reconnectInterval,
    };

    if (this.isDebug) console.log(`[MQTT] Connecting to ${url}...`);
    this.client = mqtt.connect(url, options);

    this.client.on("connect", () => {
      if (this.isDebug) console.log(`[MQTT] Connected as ${this.clientId}`);
      this.client?.subscribe(this.topic, (err) => {
        if (err) console.error("[MQTT] Subscribe error:", err.message);
        else if (this.isDebug) console.log(`[MQTT] Subscribed to topic: ${this.topic}`);
      });
    });

    this.client.on("message", (topic, message) => {
      if (this.isDebug) console.log(`[MQTT] Message received on ${topic}: ${message.toString()}`);
      this.onMessage(topic, message.toString());
    });

    this.client.on("error", (err) => {
      console.error("[MQTT] Error:", err.message);
    });

    this.client.on("close", () => {
      console.warn("[MQTT] Connection closed");
    });
  }

  publish(topic: string, message: string) {
    if (!this.client) throw new Error("MQTT client not connected");
    this.client.publish(topic, message);
    if (this.isDebug) console.log(`[MQTT] Published to ${topic}: ${message}`);
  }

  disconnect() {
    this.client?.end();
    if (this.isDebug) console.log("[MQTT] Disconnected");
  }
}