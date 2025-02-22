import type { ServerWebSocket } from "bun";

export default function handleClientRequest(ws: ServerWebSocket<unknown>, context: {
    type: "REQ";
    subscriptionId: string;
    filters: string[];
}): void {
    console.log(context);
    ws.send(JSON.stringify(["OK", context.subscriptionId]));
    console.warn("TODO: Implement handleClientRequest");
}
