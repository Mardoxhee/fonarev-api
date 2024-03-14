const Stories = require("./../models/storiesModel");
const APIfeatures = require("./../utils/apiFeatures");

exports.createStories = async (req, res) => {
  try {
    const bodies = req.body;
    bodies.account = req.decoded.id;
    const newStory = await Stories.create(bodies);
    res.status(201).json({
      status: "story created successfully",
      newStory,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      code: err.code,
      message: err.message,
    });
  }
};

exports.getAllStories = async (req, res) => {
  try {
    const features = new APIfeatures(Stories.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const stories = await features.query

    res.status(200).json({
      status: "Success",
      numberOfStories: stories.length,
      stories,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.getOneStory = async (req, res) => {
  try {
    const story = await Stories.findById(req.params.id)
    res.status(200).json({
        status: "success",
        story,
      });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
  
};
exports.updateStory = async (req, res) => {
  try {
    const story = await Stories.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      statusstatus: "success",
      story,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.deleteStory = async (req, res) => {
  try {
    await Stories.findByIdAndDelete(req.params.id);
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