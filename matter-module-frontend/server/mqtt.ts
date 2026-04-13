import { WSServer } from "../lib/ws/WSServer";
import { controllerConfig } from "./configManager";
import { MQTT } from "../lib/mqtt/mqttClient";

let mqttClient: MQTT | null = null;

export async function createMqttClient(ws: WSServer) {
  // читаем конфиг
  const conf: any = await controllerConfig.readConf();

  const url = conf?.mqtt?.urlInDocker || "mqtt://mosquitto:1883";
  const baseTopik = conf?.mqtt?.baseTopik || "module/data";
  const username = conf?.mqtt?.user;
  const password = conf?.mqtt?.password;

  // если уже есть клиент — закрываем
  if (mqttClient) {
    console.log("♻️ Reconnecting MQTT...");
    mqttClient.disconnect?.(); // добавь метод если нет
    mqttClient = null;
  }

  const parsedUrl = new URL(url);

  console.log(conf?.mqtt)

  mqttClient = new MQTT({
    host: parsedUrl.hostname,
    port: Number(parsedUrl.port) || 1883,
    isDebug: true,
    topic: `${baseTopik}/#`,
    username,
    password
  });

  console.log(mqttClient)

  mqttClient.setMessageHandler((t, mes) => {
    console.log("mqtt", t, mes)
    ws.broadcast(JSON.stringify({ topik: t, message: mes }));
  });

  mqttClient.connect()
}
