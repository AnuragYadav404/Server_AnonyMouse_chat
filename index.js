const express = require("express");
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const { availableParallelism } = require("os"); // this returns the number of cores available
const cluster = require("cluster"); // node's in built clustering module
const { createAdapter, setupPrimary } = require("@socket.io/cluster-adapter");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

// *******************************
// implementaion for auth using passport
const accountsRouter = require("./routes/accountsRouter")
const cookieParser = require("cookie-parser");
const connection = require("./config/db_connection");
const AnonUser = require("./models/User");
const MongoStore = require("connect-mongo");
const session = require("express-session");
const passport = require("passport");
// *******************************

// probably storing messages in memory not good, as processes due to fork might mess up!!?
// instead we can try db -> chat.db
// let messages = [];
// const messageids = {};

if (cluster.isPrimary) {
  // that is, it is the primary process
  console.log("Primary process is: ", process.pid);
  const num_cpus = availableParallelism();
  for (let i = 0; i < num_cpus / 2; i++) {
    cluster.fork({
      PORT: 3000,
    });
  }
  return setupPrimary(); // setup primary is usefull for setting up the ipc and management of state b/w the processes/servers
} else {
  console.log("Child process: ", process.pid);

  async function main() {
    // ****************** DB IMPLEMENTATION FOR MESSAGES USING CHAT.DB
    // chat.db setup for database
    const db = await open({
      filename: "chat.db",
      driver: sqlite3.Database,
    });

    //create table if does not exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_offset TEXT UNIQUE,
        content TEXT
      )
    `);

    // ****************** DB IMPLEMENTATION FOR MESSAGES USING CHAT.DB

    // server setup
    const app = express();
    const server = createServer(app);
    const socket_server = new Server(server, {
      cors: {
        origin: "http://localhost:5173",
      },
      connectionStateRecovery: {},
      adapter: createAdapter(),
    }); // integrates socket.io with express HTTP server

    // setup middlewares here for express via socket compatible // this is not even required!
    // *************************************
    // why do i even want to setup express middlewares on socket?, i can directly use them on app!
    // socket_server.engine.use(express.json());
    // socket_server.engine.use(express.urlencoded({ extended: false }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());

    //session setup
    /**
     * -------------- SESSION SETUP ----------------
     */

    // TODO
    // gotta implement the session
    // first set up the sessionStore
    const sessionStore = MongoStore.create({
      client: connection.getClient(),
      collectionName: "sessions",
    });
    app.use(
      session({
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: true,
        store: sessionStore,
        cookie: {
          maxAge: 1000 * 60 * 60 * 24, //24 hours age cookie
        },
      })
    );

    //passport setup
    /**
     * -------------- PASSPORT SETUP ----------------
     */

    require("./config/passport");
    app.use(passport.initialize());
    app.use(passport.session());

    /////console.log("Process serving the index route request: ", process.pid);
      return res.json({
        msg: "Hey buddy we are in the system now!",
      });
    });

      console.log(req.cookies); // this will give me about auth info
      console.log(req.session);
      // when a user is on a authenticated session
      // passport attaches a passport: { user: user_id}
      // to the req.session
      next();
    });
    app.use("/accounts", accountsRouter);

    // catch 404 and forward to error handler
    app.use(function (req, res, next) {
      next(createError(404));
    });

    // error handler
    app.use(function (err, req, res, next) {
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get("env") === "development" ? err : {};

      // render the error page
      res.status(err.status || 500);
      res.send({ msg: "error" });
    });

    // *************************************
    // this below route will now be handled in indexRouter
    app.get("/", (req, res) => {
      console.log("Process serving the index route request: ", process.pid);
      return res.json({
        msg: "Hey buddy we are in the system now!",
      });
    });

    socket_server.on("connection", async (socket) => {
      console.log("client connected", socket.id);
      console.log("client reocvery is: ", socket.recovered);
      console.log("client:", socket.handshake.auth);

      socket.on("chat_message", async (message, messageid, callback) => {
        let result;
        try {
          result = await db.run(
            "INSERT INTO messages (content, client_offset) VALUES (?, ?)",
            message,
            messageid
          );
        } catch (err) {
          if (err.errno === 19) {
            // duplicate message creation request
            callback();
          } else {
            //if error occurs, let the client retry
          }
          return;
        }
        // result.lastID will return the index of the last created row
        socket.broadcast.emit("chat_message", message, result.lastID);
        callback();
      });

      socket.on("disconnect", () => {
        console.log("client has disconnected", socket.id);
      });

      if (!socket.recovered) {
        console.log("i am dumb?");
        try {
          await db.each(
            "SELECT id, content FROM messages WHERE id > ?",
            [socket.handshake.auth.serverOffset || 0],
            (_err, row) => {
              console.log("restoring");
              socket.emit("chat_message", row.content, row.id);
            }
          );
        } catch (err) {
          // do something with the erro
        }
      }
    });

    server.listen(process.env.PORT, () => {
      console.log(`server running at : http://localhost:${process.env.PORT}`);
    });
  }

  main();
}
