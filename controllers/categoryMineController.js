const CategoryMine = require("./../models/categoryMineModel");
const APIfeatures = require("./../utils/apiFeatures");

exports.createCategory = async (req, res) => {
  try {
    const bodies = req.body;
    bodies.account = req.decoded.id;
    const newCategory = await CategoryMine.create(bodies);
    res.status(201).json({
      status: "category created successfully",
      newCategory,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      code: err.code,
      message: err.message,
    });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const features = new APIfeatures(CategoryMine.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const categories = await features.query.populate('direction');

    res.status(200).json({
      status: "Success",
      numberOfCategories: categories.length,
      categories,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.getOneCategory = async (req, res) => {
  try {
    const category = await CategoryMine.findById(req.params.id)
    .populate("agents");
    res.status(200).json({
        status: "success",
        category,
      });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
  
};
exports.updateCategory = async (req, res) => {
  try {
    const category = await CategoryMine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      statusstatus: "success",
      category,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await CategoryMine.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: "Category deleted successfully",
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: "not found",
      message: err.message,
    });
  }
};