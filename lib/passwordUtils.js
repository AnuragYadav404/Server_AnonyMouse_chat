const crypto = require("crypto");

// TODO
// validPassword, validates the incoming password
function validPassword(password, hash, salt) {
  const genHash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");

  return genHash === hash;
}

// genPassword, generates a new hashed password  on registration
function genPassword(password) {
  const salt = crypto.randomBytes(32).toString("hex");
  const genHash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");

  return {
    salt: salt,
    hash: genHash,
  };
}

module.exports.validPassword = validPassword;
module.exports.genPassword = genPassword;
