const Agent = require("../models/agentModel");
const APIfeatures = require("./../utils/apiFeatures");

//Ici on a le controlleur de création d'un agent
exports.createAgent = async (req, res) => {
  try {
    const newAgent = await Agent.create(req.body);
    res.status(201).json({
      status: "Agent enregistré avec succès !",
      newAgent,
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern) {
      // Extraire le nom de l'index ou de la clé
      const conflictKey = Object.keys(error.keyPattern)[0];

      return res.status(400).json({
        status: 'failed',
        message: "Une erreur s'est produite lors de la création de l'agent.",
        error: `Le contenu du champ  ${conflictKey} Existe déjà. Veuillez saisir des valeurs uniques.`,
      });
    }
};
}
  //Le controlleur d'affichage de tous les agents
  exports.getAgents = async (req, res) => {
    try {
      const features = new APIfeatures(Agent.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      const agents = await features.query.populate('direction').populate('account').populate("province");
      res.status(200).json({
        status: "Success",
        numberOfAgents: agents.length,
        agents: agents
      });
    } catch (err) {
      res.status(400).json({
        status: "failed",
        message: err.message,
      });
    }
  };
 //Le controlleur d'affichage d'un agent à la fois
exports.getOneAgent= async (req, res) => {
        try {
          const agent = await Agent.findById(req.params.id).populate('direction').populate('documents').populate('personnesAcharges')
          res.status(200).json({
            status: "success",
            agent,
          });
        } catch (err) {
          res.status(400).json({
            status: "failed",
            message: err.message,
          });
        }
      };



      exports.getAgentByMatricule = async (req, res) => {
        try {
          // Recherche de l'agent par son matricule
          const agent = await Agent.findOne({ matricule: req.params.matricule });
      
          if (!agent) {
            return res.status(404).json({
              status: "failed",
              message: "Aucun agent trouvé avec ce matricule.",
            });
          }
      
          // Ne retourner que les champs spécifiques
          const { noms, matricule, grade, fonction, photo } = agent;
      
          res.status(200).json({
            status: "success",
            data: {
              noms,
              matricule,
              grade,
              fonction,
              photo,
            },
          });
        } catch (err) {
          res.status(400).json({
            status: "failed",
            message: err.message,
          });
        }
      };
      
//Le controlleur de mise à jour d'un agent

            exports.updateAgent = async (req, res) => {
                try {
                const agent = await Agent.findByIdAndUpdate(req.params.id, req.body, {
                    new: true,
                });
                res.status(200).json({
                    status: "Agent modifé avec succès !",
                    agent,
                });
                } catch (err) {
                res.status(400).json({
                    status: "failed",
                    message: err.message,
                });
                }
            };
                    //Le controlleur de suppression d'un agent

            exports.deleteAgent = async (req, res) => {
                try {
                  await Agent.findByIdAndDelete(req.params.id);
                  res.status(200).json({
                    status: "agent deleted successfully",
                    data: null,
                  });
                } catch (err) {
                  res.status(404).json({
                    status: "not found",
                    message: err.message,
                  });
                }
              };