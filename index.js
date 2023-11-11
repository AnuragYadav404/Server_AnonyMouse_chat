const express = require("express");
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const { availableParallelism } = require("os"); // this returns the number of cores available
const cluster = require("cluster"); // node's in built clustering module
const { createAdapter, setupPrimary } = require("@socket.io/cluster-adapter");

if (cluster.isPrimary) {
  // that is, it is the primary process
  console.log("Primary process is: ", process.pid);
  const num_cpus = availableParallelism();
  for (let i = 0; i < num_cpus / 2; i++) {
    cluster.fork({
      PORT: 3000,
    });
  }
} else {
  console.log("Child process: ", process.pid);

  async function main() {
    const app = express();
    const server = createServer(app);
    const socket_server = new Server(server); // integrates socket.io with express HTTP server

    app.get("/", (req, res) => {
      console.log("Process serving the index route request: ", process.pid);
      return res.json({
        msg: "Hey buddy we are in the system now!",
      });
    });

    server.listen(process.env.PORT, () => {
      console.log(`server running at : http://localhost:${process.env.PORT}`);
    });
  }

  main();
}
