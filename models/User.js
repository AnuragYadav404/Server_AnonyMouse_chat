const mongoose = require("mongoose");
const connection = require("../config/db_connection");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String, required: true, minLength: 3, maxLength: 16 },
  hash: { type: String, required: true },
  salt: { type: String, required: true },
});

const AnonUser = connection.model("AnonUser", UserSchema);

module.exports = AnonUser;
