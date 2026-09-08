const express = require("express");
const fs = require('fs')
const app = express();
const bp = require('body-parser');
const AccountRouter = require("./routes/accountRoutes");
const AgentRouter = require("./routes/agentRoutes");
const DirectionRouter = require("./routes/directionRoutes");
const ServiceRouter = require("./routes/serviceRoutes");
const DivisionRouter = require("./routes/divisionRoutes");
const entrepriseMineRouter = require("./routes/entrepriseMineRoutes")
const noteDebitRouter = require("./routes/noteDebitRoutes")
const produitsRouter = require("./routes/produitsMine")
const articleRouter = require("./routes/articleRoutes")
const villeRouter = require ("./routes/villeRoutes")
const provinceRouter = require("./routes/provinceRoutes")
const storiesRoutes = require("./routes/storiesRoutes")
const categoryRoutes = require("./routes/categoryMineRoutes")
const participantRouter = require("./routes/participantRoutes")
const candidatureRouter = require("./routes/candidatureRoute")
const notePerceptionRouter = require("./routes/notePerceptionRoutes")
const DocumentRouter = require("./routes/documentRoute")
const gradeRouter = require("./routes/gradeRoutes")
const personneRouter = require("./routes/personneAchargeRoutes")
const marcheRouter = require("./routes/marcheRoutes")
const offreEmploiRouter = require("./routes/offreEmploiRoutes")
const newsletterRouter = require("./routes/newsletterRoutes")
const applicationFormRouter = require("./routes/applicationFormRoutes")

app.use(bp.json())
var cors = require("cors");
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(express.raw({ limit: '500mb', type: '*/*' }));

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const corsOptions = {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
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
app.use("/divisions", cors(corsOptions), DivisionRouter);
app.use("/entrepriseminieres", cors(corsOptions), entrepriseMineRouter);
app.use("/notededebit", cors(corsOptions), noteDebitRouter);
app.use("/produits-miniers", cors(corsOptions), produitsRouter);
app.use("/articles", cors(corsOptions), articleRouter);
app.use("/villes", cors(corsOptions), villeRouter);
app.use("/provinces", cors(corsOptions),provinceRouter);
app.use("/stories", cors(corsOptions), storiesRoutes);
app.use("/categories-mine", cors(corsOptions), categoryRoutes);
app.use("/participants", cors(corsOptions), participantRouter);
app.use("/candidatures", cors(corsOptions), candidatureRouter);
app.use("/notes-perception", cors(corsOptions), notePerceptionRouter);
app.use("/documents", cors(corsOptions),DocumentRouter);
app.use("/grades", cors(corsOptions),gradeRouter);
app.use("/personnes", cors(corsOptions),personneRouter);
app.use("/marches", cors(corsOptions), marcheRouter);
app.use("/offres-emploi", cors(corsOptions), offreEmploiRouter);
app.use("/newsletters", cors(corsOptions), newsletterRouter);
app.use("/formulaires", cors(corsOptions), applicationFormRouter);



module.exports = app;
