const Article = require("../models/articlesModel");
const APIfeatures = require("../utils/apiFeatures");

exports.createArticle = async (req, res) => {
  try {
    const bodies = req.body;
    bodies.account = req.decoded.id;
    bodies.date = new Date(); 
    const newArticle = await Article.create(bodies);
    res.status(201).json({
      status: "Article created successfully",
      newArticle,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      code: err.code,
      message: err.message,
    });
  }
};

exports.getAllArticles = async (req, res) => {
  try {
    const features = new APIfeatures(Article.find(), req.query)
      // .filter()
      // .sort()
      // .limitFields()
    const article = await features.query;
    res.status(200).json({
      status: "Success",
      numberOfArticle: article.length,
      article,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.getOneArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
    res.status(200).json({
        status: "success",
        article,
      });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
  
};
exports.updateArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      statusstatus: "success",
      article,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    await Article.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: "Article deleted successfully",
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: "not found",
      message: err.message,
    });
  }
};

// Nouvelle méthode pour les 5 derniers articles
exports.getLastArticles = async (req, res) => {
  try {
    const articles = await Article.find().sort({ date: -1 }).limit(5);
    res.status(200).json({
      status: "Success",
      articles,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};