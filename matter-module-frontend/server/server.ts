import next from 'next';
import { createServer } from 'http';
import { parse } from 'url';

const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== 'production';
export const NEXT_PUBLIC_WS_PREFIX = process.env.NEXT_PUBLIC_WS_PREFIX

const app = next({ dev });
const handle = app.getRequestHandler();

import { ws } from '../lib/ws';
import { createMqttClient, getMqtt } from './mqtt';
import { controllerConfig } from './configManager';


app.prepare().then(async () => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  ws.connect({
    server,
    path: `/ws/${NEXT_PUBLIC_WS_PREFIX}`,
    async onMessage(msg) {
      console.log(msg);

      try {
        const data = JSON.parse(msg);

        if (data.type === "command" && data.data === "restart") {
          console.log("🔄 Restart command received");

          await controllerConfig._reloadTopik(); // обновляем конфиг
          await createMqttClient(ws);            // пересоздаём MQTT
        }
        else if (data.type === "command" && "topic" in data && "message" in data){
          const mqtt = await getMqtt(ws)
          mqtt.publish(data.topic, data.message)
        }

      } catch (e) {
        console.error("WS parse error", e);
      }
    },
  });
  await createMqttClient(ws);

  server.listen(port, () => {
    console.log(`🚀 Ready on ${port}`);
  });
});