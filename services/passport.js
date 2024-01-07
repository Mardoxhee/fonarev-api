const passport = require("passport");
const mongoose = require("mongoose");
const localStrategy = require("passport-local").Strategy;
const JWTstrategy = require("passport-jwt").Strategy;
const ExtractJWT = require("passport-jwt").ExtractJwt;
const User = mongoose.model("users");

const config = require("../config");

// Create a passport middleware to handle user registration
passport.use(
  "signup",
  new localStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (email, password, done) => {
      return User.create({ email, password }, (error, user) => {
        if (error) {
          return done(error);
        }

        return done(null, user);
      });
    }
  )
);

// Create a passport middleware to handle User login
passport.use(
  "signin",
  new localStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (email, password, done) => {
      return User.findOne({ email })
        .then((user) => {
          // Check if user is present in the database
          if (!user) {
            return done(null, false, { message: "User not found" });
          }

          // Validate password and make sure it is valid
          if (!user.validPassword(password)) {
            return done(null, false, { message: "Wrong Password" });
          }

          return done(null, user);
        })
        .catch((error) => done(error));
    }
  )
);

// Create a passport muidlleware that checks if the token sent by the user
passport.use(
  new JWTstrategy(
    {
      secretOrKey: config.secret,
      // Extract token from request
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    },
    (token, done) => {
      if (token) return done(null, token.user);

      return done(error);
    }
  )
);