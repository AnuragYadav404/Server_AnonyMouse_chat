const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const connection = require("./db_connection");
const AnonUser = require("../models/User");
const validPassword = require("../lib/passwordUtils").validPassword;

// we are gonna use strategy, so first we need to set it up

// TODO: passport.use();
// here we will define the configuration for passport

// we can here modify username and password namespace for verifyCallback passport

const customFields = {
  usernameField: "username",
  passwordField: "password",
};

// verify callback is responsible for checking validity of login credentials
const verifyCallback = async function (username, password, done) {
  // here we can do any implementation of verifycallback
  // we just have to conform to use of done() -> this is what passport cares for
  AnonUser.findOne({ username: username })
    .then((user) => {
      if (!user) {
        //the user is not found in the db
        return done(null, false);
      }
      const isValidLogin = validPassword(password, user.hash, user.salt);
      if (isValidLogin) {
        //valid login credentials
        return done(null, user);
      } else {
        return done(null, false);
      }
    })
    .catch((err) => {
      done(err);
    });
};

const strategy = new LocalStrategy(customFields, verifyCallback); // here we will pass it a callback
passport.use(strategy);

passport.serializeUser((user, done) => {
  // passport plays with the session
  // this is the magic, this on passing the verifyCallback will pass in the user
  // passport will now attach field `passport: {user: user.id}` to the session
  // of the particular session token
  done(null, user.id);
});

// deserialize is responsible for taking userid from session.passport.user
// and then populates req.user with the result

passport.deserializeUser((userId, done) => {
  AnonUser.findById(userId)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => done(err));
});
