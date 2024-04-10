const ProduitsMine = require("./../models/produitsMine");
const APIfeatures = require("./../utils/apiFeatures");

exports.createProduct = async (req, res) => {
  try {
    const bodies = req.body;
    bodies.account = req.decoded.id;
    const newProduct = await ProduitsMine.create(bodies);
    res.status(201).json({
      status: "produit created successfully",
      newProduct,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      code: err.code,
      message: err.message,
    });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const features = new APIfeatures(ProduitsMine.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const produit = await features.query.populate('categorie').populate("account")

    res.status(200).json({
      status: "Success",
      numberOfServices: produit.length,
      produit,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.getOneProduct = async (req, res) => {
  try {
    const produit = await ProduitsMine.findById(req.params.id).populate("categorie")
    res.status(200).json({
        status: "success",
        produit,
      });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
  
};
exports.updateProduct = async (req, res) => {
  try {
    const produit = await ProduitsMine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      statusstatus: "success",
      produit,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await ProduitsMine.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: "Service deleted successfully",
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: "not found",
      message: err.message,
    });
  }
};