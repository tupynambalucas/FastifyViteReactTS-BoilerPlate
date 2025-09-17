export default async function (server, opts) {
  server.get("/test", async function (req, res) { return {} });
}