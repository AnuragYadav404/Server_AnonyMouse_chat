const mongoose = require("mongoose");
require("dotenv").config();

/**
 * -------------- DATABASE ----------------
 */

/**
 * Connect to MongoDB Server using the connection string in the `.env` file.  To implement this, place the following
 * string into the `.env` file
 *
 * DB_STRING=mongodb://<user>:<password>@cluster_or_whatever/database_name
 */

const mongoURL = process.env.DB_STRING;

const connection = mongoose.createConnection(mongoURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = connection;
