const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

// so as an api microservice
/// what all will be the service provided by an accounts router?
// handling the following :->
/*
    1. post for login!
    2. post for signup
    3. post for logout
*/
router.post("/login", (req, res, next) => {
  return res.json({
    msg: "this handles post login route",
  });
});

router.post("/logout", (req, res, next) => {
  return res.json({
    msg: "this handles post logout route",
  });
});

router.post("/signup", (req, res, next) => {
  return res.json({
    msg: "this handles post sign-up route",
  });
});

module.exports = router;
