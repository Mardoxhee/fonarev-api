const Account = require("../models/accountModel");

const publicFields = "firstName lastName phone email role active createdAt updatedAt";

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const accountPayload = (body) => {
  const allowed = ["firstName", "lastName", "phone", "email", "role", "active"];
  return allowed.reduce((payload, field) => {
    if (body[field] !== undefined) payload[field] = body[field];
    return payload;
  }, {});
};

exports.createAccount = async (req, res) => {
  try {
    const account = await Account.create({
      ...accountPayload(req.body),
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });

    res.status(201).json({
      status: "Success",
      account: await Account.findById(account._id).select(publicFields),
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.getAllAccounts = async (req, res) => {
  try {
    const query = {};
    if (req.query.role) query.role = req.query.role;
    if (req.query.active !== undefined) query.active = String(req.query.active) === "true";
    if (req.query.search) {
      const regex = new RegExp(escapeRegex(req.query.search), "i");
      query.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }, { phone: regex }, { role: regex }];
    }

    const accounts = await Account.find(query).select(publicFields).sort({ createdAt: -1, lastName: 1 });

    res.status(200).json({
      status: "Success",
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
    const account = await Account.findById(req.params.id).select(publicFields);
    if (!account) {
      return res.status(404).json({
        status: "failed",
        message: "Compte introuvable",
      });
    }

    res.status(200).json({
      status: "Success",
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
    const account = await Account.findByIdAndUpdate(req.params.id, accountPayload(req.body), {
      new: true,
      runValidators: true,
    }).select(publicFields);

    if (!account) {
      return res.status(404).json({
        status: "failed",
        message: "Compte introuvable",
      });
    }

    res.status(200).json({
      status: "Success",
      account,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.resetAccountPassword = async (req, res) => {
  try {
    const { password, passwordConfirm } = req.body;
    if (!password || !passwordConfirm) {
      return res.status(400).json({
        status: "failed",
        message: "Le mot de passe et sa confirmation sont obligatoires.",
      });
    }

    const account = await Account.findById(req.params.id).select("+password");
    if (!account) {
      return res.status(404).json({
        status: "failed",
        message: "Compte introuvable",
      });
    }

    account.password = password;
    account.passwordConfirm = passwordConfirm;
    account.passwordResetToken = undefined;
    account.passwordResetExpires = undefined;
    await account.save();

    res.status(200).json({
      status: "Success",
      message: "Mot de passe mis à jour.",
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const account = await Account.findByIdAndDelete(req.params.id);
    if (!account) {
      return res.status(404).json({
        status: "failed",
        message: "Compte introuvable",
      });
    }

    res.status(200).json({
      status: "Deleted successfully",
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};
