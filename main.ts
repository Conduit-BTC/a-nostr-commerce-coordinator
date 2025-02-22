import { handleNewClientMessage } from "./nEventSystem/clientMessageHandlers/handleNewClientMessage";
import type { ServerWebSocket } from "bun";

Bun.serve({
    fetch(req, server) {
        if (server.upgrade(req)) {
            return;
        }
        return new Response("Upgrade failed", { status: 500 });
    },
    websocket: {
        message(ws: ServerWebSocket<unknown>, message: string | Buffer) {
            if (typeof message !== typeof "") {
                ws.close(1003, 'Invalid message type.')
                return;
            };
            handleNewClientMessage(ws, message as string);
        },
        open(ws) {
            console.log('Socket opened!');
        },
        close(ws, code, message) {
            console.log('Socket closed!');
            console.log(code);
            console.log(message);
        },
        drain(ws) { }, // the socket is ready to receive more data
    },
});
