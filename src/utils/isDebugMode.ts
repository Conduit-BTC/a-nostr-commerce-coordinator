export default function isDebugMode(): boolean {
    return process.env.DEBUG !== undefined && process.env.DEBUG == "1";
}
