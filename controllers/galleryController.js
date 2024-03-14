const Gallery = require("./../models/galleryModel");
const APIfeatures = require("./../utils/apiFeatures");

exports.createGallery = async (req, res) => {
  try {
    const bodies = req.body;
    bodies.account = req.decoded.id;
    bodies.date = date.now()
    const newGallery = await Gallery.create(bodies);
    res.status(201).json({
      status: "Gallery created successfully",
      newGallery,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      code: err.code,
      message: err.message,
    });
  }
};

exports.getAllGalleries = async (req, res) => {
  try {
    const features = new APIfeatures(Gallery.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const gallery = await features.query;
    res.status(200).json({
      status: "Success",
      numberOfPictures: gallery.length,
      gallery,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.getOneGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id)
    .populate("agents");
    res.status(200).json({
        status: "success",
        gallery,
      });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
  
};
exports.updateGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      statusstatus: "success",
      gallery,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.deleteGallery = async (req, res) => {
  try {
    await Gallery.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: "Gallery deleted successfully",
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: "not found",
      message: err.message,
    });
  }
};