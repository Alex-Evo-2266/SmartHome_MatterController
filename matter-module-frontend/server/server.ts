import next from 'next';
import { createServer } from 'http';
import { parse } from 'url';

const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== 'production';

const app = next({ dev });
const handle = app.getRequestHandler();

import { ws } from '../lib/ws';
import { MQTT } from '../lib/mqtt/mqttClient';


app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  ws.connect({
    server,
    path: "/ws/module",
    onMessage(msg) {
      console.log(msg)
    },
});
const mqttClient = new MQTT({
  host: "localhost",
  port: 1883,
  topic: "module/data",
  isDebug: true,
});

mqttClient.setMessageHandler((t, mes)=>{
  ws.broadcast(JSON.stringify({"topik": t, message: mes}))
})



  server.listen(port, () => {
    console.log(`🚀 Ready on ${port}`);
  });
});