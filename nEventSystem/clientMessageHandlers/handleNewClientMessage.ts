import type { ServerWebSocket } from "bun";
import { z } from "zod";
import handleClientRequest from "./handleClientRequest";

const nClientEventTypes = ["REQ", "EVENT", "AUTH", "CLOSE"] as const;
const nRelayEventTypes = ["EVENT", "OK", "EOSE", "CLOSED", "NOTICE", "AUTH"] as const;

type ClientMessage = [
    (typeof nClientEventTypes)[number],
    ...string[]
]

type NRelayMessage = [
    (typeof nRelayEventTypes)[number],
    ...string[]
]

function parseClientMessage(message: string): ClientMessage | false {
    try {
        const eventArray = z
            .tuple([
                z.enum(nClientEventTypes),
                z.string().optional(),
            ])
            .rest(z.string());

        return eventArray.parse(JSON.parse(message)) as ClientMessage;
    } catch (e: unknown) {
        return false;
    }
}

export function handleNewClientMessage(ws: ServerWebSocket<unknown>, message: string): void {
    let nClientMessage: ClientMessage | false = parseClientMessage(message);

    if (!nClientMessage) {
        ws.close(1003, `Invalid message type.`);
        return;
    }

    switch (nClientMessage[0]) {
        case "REQ":
            const context = {
                type: "REQ" as "REQ",
                subscriptionId: nClientMessage[1],
                filters: nClientMessage.slice(2),
            }
            handleClientRequest(ws, context);
            break;
        case "EVENT":
            console.log("EVENT");
            break;
        case "AUTH":
            console.log("AUTH");
            break;
        case "CLOSE":
            console.log("CLOSE");
            break;
        default:
            ws.close(1003, "Invalid message type: " + nClientMessage[0]);
    }
}
