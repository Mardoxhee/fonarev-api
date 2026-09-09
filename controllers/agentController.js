const Agent = require("../models/agentModel");
const Service = require("../models/serviceModel");
const Division = require("../models/divisionModel");
const Direction = require("../models/directionModel");
const Province = require("../models/provinceModel");

const objectIdPattern = /^[a-f\d]{24}$/i;

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseClientDate = (value) => {
  const rawValue = String(value || "").trim();
  if (!rawValue) return null;

  const frenchDate = rawValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (frenchDate) {
    const [, day, month, year] = frenchDate;
    return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00.000Z`);
  }

  const date = new Date(rawValue);
  return Number.isNaN(date.getTime()) ? null : date;
};

const yearsAgo = (years) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setFullYear(date.getFullYear() - years);
  return date;
};

const dateRangeForElapsedYears = (minYears, maxYears) => {
  const range = {};
  if (minYears !== undefined && minYears !== "") range.$lte = yearsAgo(Number(minYears));
  if (maxYears !== undefined && maxYears !== "") {
    const minDate = yearsAgo(Number(maxYears) + 1);
    minDate.setDate(minDate.getDate() + 1);
    range.$gte = minDate;
  }
  return Object.keys(range).length ? range : null;
};

const resolveReferenceIds = async (Model, fields, value) => {
  const cleanValue = String(value || "").trim();
  if (!cleanValue) return [];
  if (objectIdPattern.test(cleanValue)) return [cleanValue];

  const regex = new RegExp(escapeRegex(cleanValue), "i");
  const items = await Model.find({ $or: fields.map((field) => ({ [field]: regex })) }).select("_id");
  return items.map((item) => item._id);
};

const buildSort = (sortQuery) => {
  if (!sortQuery) return "-createdAt";
  const sortMap = {
    nom: "noms",
    noms: "noms",
    matricule: "matricule",
    sexe: "sexe",
    statut: "statut",
    grade: "grade",
    fonction: "fonction",
    direction: "direction",
    province: "province",
  };

  return String(sortQuery)
    .split(",")
    .map((field) => {
      const desc = field.trim().startsWith("-");
      const cleanField = field.trim().replace(/^-/, "");
      const mappedField = sortMap[cleanField] || cleanField;
      return `${desc ? "-" : ""}${mappedField}`;
    })
    .join(" ");
};

const buildAgentQuery = async (queryParams) => {
  const query = {};
  const andFilters = [];

  if (queryParams.statut) query.statut = queryParams.statut;
  if (queryParams.sexe) query.sexe = String(queryParams.sexe).toUpperCase();
  if (queryParams.grade) query.grade = new RegExp(`^${escapeRegex(queryParams.grade)}$`, "i");

  const hireRange = {};
  const hireFrom = parseClientDate(queryParams.hireFrom);
  const hireTo = parseClientDate(queryParams.hireTo);
  if (hireFrom) hireRange.$gte = hireFrom;
  if (hireTo) {
    hireTo.setHours(23, 59, 59, 999);
    hireRange.$lte = hireTo;
  }
  if (Object.keys(hireRange).length) query.dateEntree = hireRange;

  const ageRange = dateRangeForElapsedYears(queryParams.ageMin, queryParams.ageMax);
  if (ageRange) query.dateNaissance = ageRange;

  const seniorityRange = dateRangeForElapsedYears(queryParams.seniorityMin, queryParams.seniorityMax);
  if (seniorityRange) {
    query.dateEntree = {
      ...(query.dateEntree || {}),
      ...seniorityRange,
    };
  }

  const [directionIds, provinceIds, divisionIds, serviceIds] = await Promise.all([
    resolveReferenceIds(Direction, ["denomination", "description"], queryParams.direction),
    resolveReferenceIds(Province, ["nom", "Province", "province", "chef_lieu"], queryParams.province),
    resolveReferenceIds(Division, ["denomination", "description", "descrption"], queryParams.division),
    resolveReferenceIds(Service, ["denomination", "description", "descrption"], queryParams.service),
  ]);

  if (queryParams.direction) andFilters.push(directionIds.length ? { direction: { $in: directionIds } } : { _id: null });
  if (queryParams.province) andFilters.push(provinceIds.length ? { province: { $in: provinceIds } } : { _id: null });
  if (queryParams.division) andFilters.push(divisionIds.length ? { division: { $in: divisionIds } } : { _id: null });
  if (queryParams.service) {
    const serviceRegex = new RegExp(`^${escapeRegex(queryParams.service)}$`, "i");
    andFilters.push(serviceIds.length ? { $or: [{ serviceRef: { $in: serviceIds } }, { service: serviceRegex }] } : { service: serviceRegex });
  }

  if (queryParams.search) {
    const regex = new RegExp(escapeRegex(queryParams.search), "i");
    const [searchDirectionIds, searchProvinceIds, searchDivisionIds, searchServiceIds] = await Promise.all([
      resolveReferenceIds(Direction, ["denomination", "description"], queryParams.search),
      resolveReferenceIds(Province, ["nom", "Province", "province", "chef_lieu"], queryParams.search),
      resolveReferenceIds(Division, ["denomination", "description", "descrption"], queryParams.search),
      resolveReferenceIds(Service, ["denomination", "description", "descrption"], queryParams.search),
    ]);

    andFilters.push({
      $or: [
        { noms: regex },
        { postnom: regex },
        { prenom: regex },
        { matricule: regex },
        { grade: regex },
        { fonction: regex },
        { service: regex },
        { statut: regex },
        { nationalite: regex },
        { phone: regex },
        { emailPro: regex },
        { emailPerso: regex },
        ...(searchDirectionIds.length ? [{ direction: { $in: searchDirectionIds } }] : []),
        ...(searchProvinceIds.length ? [{ province: { $in: searchProvinceIds } }] : []),
        ...(searchDivisionIds.length ? [{ division: { $in: searchDivisionIds } }] : []),
        ...(searchServiceIds.length ? [{ serviceRef: { $in: searchServiceIds } }] : []),
      ],
    });
  }

  if (andFilters.length) query.$and = andFilters;
  return query;
};

const normalizeAgentPayload = async (payload) => {
  const body = { ...payload };
  if (body.etatCivil !== undefined && body.etatcivile === undefined) body.etatcivile = body.etatCivil;
  if (body.nombreEnfants !== undefined && body.nombrenfants === undefined) body.nombrenfants = body.nombreEnfants;
  if (body.serviceId !== undefined && body.serviceRef === undefined) body.serviceRef = body.serviceId;
  if (body.divisionId !== undefined && body.division === undefined) body.division = body.divisionId;
  if (body.directionId !== undefined && body.direction === undefined) body.direction = body.directionId;
  if (body.provinceId !== undefined && body.province === undefined) body.province = body.provinceId;
  delete body.etatCivil;
  delete body.nombreEnfants;
  delete body.serviceId;
  delete body.divisionId;
  delete body.directionId;
  delete body.provinceId;

  if (body.serviceRef) {
    const service = await Service.findById(body.serviceRef);
    if (service) {
      body.division = service.division;
      body.direction = service.direction;
      if (!body.service && service.denomination) body.service = service.denomination;
    }
  }

  if (body.division && !body.direction) {
    const division = await Division.findById(body.division);
    if (division) body.direction = division.direction;
  }

  return body;
};

//Ici on a le controlleur de création d'un agent
exports.createAgent = async (req, res) => {
  try {
    const newAgent = await Agent.create(await normalizeAgentPayload(req.body));
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

    return res.status(400).json({
      status: "failed",
      message: error.message,
    });
  }
};
  //Le controlleur d'affichage de tous les agents
  exports.getAgents = async (req, res) => {
    try {
      const page = req.query.page * 1 || 1;
      const limit = req.query.limit * 1 || 20;
      const skip = (page - 1) * limit;
      const fields = req.query.fields ? String(req.query.fields).split(",").join(" ") : "-__v";
      const sort = buildSort(req.query.sort);
      const agentQuery = await buildAgentQuery(req.query);
      const statuslessParams = { ...req.query };
      delete statuslessParams.statut;
      const statuslessQuery = await buildAgentQuery(statuslessParams);

      const agents = await Agent.find(agentQuery)
        .select(fields)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('direction')
        .populate('division')
        .populate('serviceRef')
        .populate('account')
        .populate("province");

      const [totalAgents, totalFemmes, totalHommes, totalTous, totalActifs, totalInactifs, totalRetraites] = await Promise.all([
        Agent.countDocuments(agentQuery),
        Agent.countDocuments({ ...agentQuery, sexe: "F" }),
        Agent.countDocuments({ ...agentQuery, sexe: "M" }),
        Agent.countDocuments(statuslessQuery),
        Agent.countDocuments({ ...statuslessQuery, statut: "Actif" }),
        Agent.countDocuments({ ...statuslessQuery, statut: "Inactif" }),
        Agent.countDocuments({ ...statuslessQuery, statut: "Retraité" }),
      ]);

      res.status(200).json({
        status: "Success",
        numberOfAgents: agents.length,
        totalAgents,
        totalFemmes,
        totalHommes,
        statusTotals: {
          total: totalTous,
          actifs: totalActifs,
          inactifs: totalInactifs,
          retraites: totalRetraites,
        },
        genderTotals: {
          femmes: totalFemmes,
          hommes: totalHommes,
        },
        page,
        limit,
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
          const agent = await Agent.findById(req.params.id)
            .populate('direction')
            .populate('division')
            .populate('serviceRef')
            .populate('province')
            .populate({ path: 'documents', populate: { path: 'documentType' } })
            .populate('personnesAcharges')
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
                const agent = await Agent.findByIdAndUpdate(req.params.id, await normalizeAgentPayload(req.body), {
                    new: true,
                    runValidators: true,
                })
                .populate('direction')
                .populate('division')
                .populate('serviceRef')
                .populate('province')
                .populate({ path: 'documents', populate: { path: 'documentType' } })
                .populate('personnesAcharges');
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
