const Agent = require("../models/agentModel");
const APIfeatures = require("./../utils/apiFeatures");

//Ici on a le controlleur de création d'un agent
exports.createAgent = async (req, res) => {
  try {
    const existingAgent = await Agent.findOne({ matricule: req.body.matricule });
    if (existingAgent) {
      return res.status(400).json({
        status: "failed",
        message: "Le matricule existe déjà. Veuillez en choisir un autre.",
      });
    }
    const dernierAgent = await Agent.findOne({}, {}, { sort: { numero: -1 } });
    const numeroSuivant = dernierAgent ? dernierAgent.numero + 1 : 1;
    const newAgent = await Agent.create({ ...req.body, numero: numeroSuivant });
    res.status(201).json({
      status: "Agent enregistré avec succès !",
      newAgent,
    });
  } catch (err) {
    res.status(500).json({
      status: "failed",
      message: "Une erreur s'est produite lors de la création de l'agent.",
      error: err.message,
    });
  }
};

  //Le controlleur d'affichage de tous les agents
  exports.getAgents = async (req, res) => {
    try {
      const features = new APIfeatures(Agent.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      const agents = await features.query;
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
          const agent = await Agent.findById(req.params.id);
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