const express = require("express");
const app = express();
const bp = require('body-parser');
const AccountRouter = require("./routes/accountRoutes");
const AgentRouter = require("./routes/agentRoutes");
const DirectionRouter = require("./routes/directionRoutes");
const ServiceRouter = require("./routes/serviceRoutes");

app.use(bp.json())
var cors = require("cors");

const corsOptions = {
    origin:"*",
    credentials: true,
    optionsSuccessStatus: 200,
     // some legacy browsers (IE11, various SmartTVs) choke on 204
  };


  app.get("/", function (req, res) {
    res.send(
      "Welcom to fonarev API========== copy this link to read the documenation of this api ======================== https://docs.google.com/document/d/1qo06FtuJOP4jzVf2ewAspeEGRnIJEly3b4ZzpQ7tGxg/edit?usp=sharing"
    );
  });
app.use("/agents", cors(corsOptions), AgentRouter);
app.use("/accounts", cors(corsOptions), AccountRouter);
app.use("/directions", cors(corsOptions), DirectionRouter);
app.use("/services", cors(corsOptions), ServiceRouter);

module.exports = app;