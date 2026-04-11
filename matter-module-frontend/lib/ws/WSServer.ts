import { Server as HttpServer } from "http";
import WebSocket, { WebSocketServer } from "ws";

export interface WSServerOptions {
  server?: HttpServer; // если хотим привязку к существующему HTTP серверу
  port?: number;        // если отдельный порт
  path: string
  onMessage?: (msg: string) => void;
  isDebug?: boolean;
}

export class WSServer {
  private wss: WebSocketServer | null = null;
  private isDebug: boolean = false;

  constructor() {}

  connect(options: WSServerOptions) {
    this.isDebug = options.isDebug ?? false;

    if (options.server) {
      this.wss = new WebSocketServer({ server: options.server, path: options.path });
    } else {
      this.wss = new WebSocketServer({ port: options.port ?? 3001, path: options.path });
    }

    this.wss.on("connection", (ws) => {
      if (this.isDebug) console.log("✅ WS client connected");

      ws.on("message", (msg) => {
        if (this.isDebug) console.log("Received message:", msg.toString());
        options.onMessage?.(msg.toString());
      });

      ws.on("close", () => {
        if (this.isDebug) console.log("WS client disconnected");
      });
    });

    console.log(
      `✅ WS Server started${options.server ? " on HTTP server" : ` on port ${options.port ?? 3001}`}`
    );
  }

  broadcast(message: string) {
    if (!this.wss) return;
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  close() {
    this.wss?.close();
    console.log("❌ WS Server stopped");
    this.wss = null;
  }
}