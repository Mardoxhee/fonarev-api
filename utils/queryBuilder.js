exports.pickUpdateMeta = (req, body = {}) => {
  const payload = { ...body };
  if (req.decoded && req.decoded.id) {
    payload.updatedBy = req.decoded.id;
  }
  return payload;
};

exports.withAuthor = (req, body = {}) => {
  const payload = { ...body };
  if (req.decoded && req.decoded.id) {
    payload.createdBy = req.decoded.id;
    payload.updatedBy = req.decoded.id;
  }
  return payload;
};

exports.applyCommonQuery = (Model, req, publicFilter = {}) => {
  const query = { ...publicFilter };
  const {
    q,
    page = 1,
    limit = 20,
    sort = "-createdAt",
    fields,
    etat,
    ...filters
  } = req.query;

  Object.keys(filters).forEach((key) => {
    if (filters[key] !== undefined && filters[key] !== "") {
      query[key] = filters[key];
    }
  });

  if (q) {
    query.$text = { $search: q };
  }

  if (etat === "ouverts") {
    query.$or = [{ dateCloture: { $gte: new Date() } }, { dateCloture: { $exists: false } }];
  }

  if (etat === "expires") {
    query.dateCloture = { $lt: new Date() };
  }

  const selectedFields = fields ? fields.split(",").join(" ") : "-__v";
  const skip = ((Number(page) || 1) - 1) * (Number(limit) || 20);

  return {
    mongoQuery: Model.find(query)
      .select(selectedFields)
      .sort(sort.split(",").join(" "))
      .skip(skip)
      .limit(Number(limit) || 20),
    countQuery: Model.countDocuments(query),
    page: Number(page) || 1,
    limit: Number(limit) || 20,
  };
};

exports.findByIdOrSlug = (Model, idOrSlug) => {
  if (idOrSlug && idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
    return Model.findById(idOrSlug);
  }
  return Model.findOne({ slug: idOrSlug });
};
