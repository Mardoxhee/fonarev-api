const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
const app = require("./app");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
mongoose.set('strictQuery', true);


// On configure le port d'éxecution de notre application
const port = process.env.PORT ||5000 ;
app.listen(port, () => {
  console.log(`server running on port ${port}`);
});

// On connecte à la base de données
mongoose.connect(process.env.BDURL)
.then(() => console.log('Connexion à MongoDB réussie !'))
.catch(() => console.log('Connexion à MongoDB échouée !'));