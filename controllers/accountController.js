const Account = require("../models/accountModel");
const APIfeatures = require("./../utils/apiFeatures");

exports.getAllAccounts = async (req, res) => {
  try {
    const features = new APIfeatures(Account.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    const accounts =  await features.query.populate('agentSuperviseur');
    // Send response
    res.status(200).json({
      status: "success",
      accountNumber: accounts.length,
        accounts,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.getAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id).populate({
      path: 'entrepriseMine',
      populate: {
        path: 'province'
      }
    });
    res.status(200).json({
      status: "sucess",
        account,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const account = await Account.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json({
      status: "Le compte a été modifié avec succès",
      data: {
        account,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "not found",
      message: err.message,
    });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    await Account.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: "Deleted successfully",
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: "not found",
      message: err.message,
    });
  }
};