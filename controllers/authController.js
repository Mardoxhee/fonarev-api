const crypto = require("crypto");
const Account = require("./../models/accountModel");
const jwt = require("jsonwebtoken");
const sendMail = require("./../utils/email");


const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = async (req, res) => {
  try {
    const newAccount = await Account.create(req.body);
    const token = signToken(newAccount._id);
    res.locals.auditAction = "signup";
    res.locals.auditModule = "accounts";
    res.locals.auditResourceId = newAccount._id;
    res.locals.auditActor = {
      id: newAccount._id,
      firstName: newAccount.firstName,
      lastName: newAccount.lastName,
      email: newAccount.email,
      role: newAccount.role,
    };
    res.status(201).json({
      status: "Le compte a été créé avec succès!",
      accountId: newAccount._id,
      token,
      data: {
        newAccount,
      },
    });
    // await sendMail({
    //   to: newAccount.email,
    //   subject: "Account created successfully !",
    //   html: "<p>You are registered as restaurator, you can create restaurants and publish all your activities for free</p> <p> The next step for you is to create your first restaurant</p>",
    //   // message: "lish your activities for free",
    // })
    //   .then(() => {
    //     console.log("Email sent");
    //   })
    //   .catch((error) => {
    //     console.error(error.response.body);
    //   });
  } catch (err) {
    res.status(400).json({
      status: "Echec, le compte n'a pas été créé",
      message: err.message,
    });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1) check if email and password exist

    if (!email || !password) {
      return res.status(400).json({
        status: "failed",
        message: "mention a email and a password",
      });
    }

    const account = await Account.findOne({ email }).select("+password ");
    if (
      !account ||
      !(await account.correctPassword(password, account.password))
    ) {
      return res
        .status(401)
        .json({ status: "failed", message: "incorrect mail or password" });
    }
    //console.log(account);

    // 3) if every thing is ok, then send the token to the client and

    const token = signToken(account._id);
    res.locals.auditAction = "login";
    res.locals.auditModule = "accounts";
    res.locals.auditResourceId = account._id;
    res.locals.auditActor = {
      id: account._id,
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      role: account.role,
    };

    res.status(200).json({
      status: "connected to the platform",
      accountId: account._id,
      firstName:account.firstName,
      lastName:account.lastName,
      email : account.email,
      role : account.role,
      token,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

const SECRET_KEY = process.env.JWT_SECRET;

exports.protect = async (req, res, next) => {
  let token = req.headers["x-access-token"] || req.headers["authorization"];
  if (!!token && token.startsWith("Bearer ")) {
    token = token.slice(7, token.length);
  }

  if (token) {
    jwt.verify(token, SECRET_KEY, async (err, decoded) => {
      if (err) {
        return res.status(401).json("token_not_valid");
      } else {
        req.decoded = decoded;
        const accountId = decoded.id || decoded.user?.id || decoded.user?._id;
        if (!accountId) {
          return res.status(401).json("token_not_valid");
        }

        req.account = await Account.findById(accountId).select("firstName lastName email role active");
        if (!req.account || req.account.active === false) {
          return res.status(401).json("account_not_found");
        }

        const expiresIn = 24 * 60 * 60;
        const newToken = jwt.sign(
          {
            id: accountId,
          },
          SECRET_KEY,
          {
            expiresIn: expiresIn,
          }
        );

        res.header("Authorization", "Bearer " + newToken);
        next();
      }
    });
  } else {
    return res.status(401).json("token_required");
  }
};

exports.restrictTo = (...roles) => {
  const allowedRoles = roles.map((role) => String(role).trim().toLowerCase());
  return async (req, res, next) => {
    const accountId = req.decoded?.id || req.decoded?.user?.id || req.decoded?.user?._id;
    const account = req.account || (accountId ? await Account.findById(accountId).select("role") : null);
    const role = String(account?.role || "").trim().toLowerCase();

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        status: "failed",
        message: "Vous n'avez pas la permission d'effectuer cette action.",
      });
    }

    next();
  };
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        status: "failed",
        message: "L'adresse email est obligatoire.",
      });
    }

    const account = await Account.findOne({ email });
    if (!account) {
      return res.status(200).json({
        status: "Success",
        message: "Si ce compte existe, un lien de réinitialisation a été envoyé.",
      });
    }

    const resetToken = account.createPasswordResetToken();
    await account.save({ validateBeforeSave: false });

    const frontendURL = process.env.FRONTEND_URL || process.env.CLIENT_URL;
    const appResetURL = frontendURL
      ? `${frontendURL.replace(/\/$/, "")}/reset-password/${resetToken}`
      : `${req.protocol}://${req.get("host")}/accounts/resetPassword/${resetToken}`;
    const apiResetURL = `${req.protocol}://${req.get("host")}/accounts/resetPassword/${resetToken}`;

    if (process.env.SENDGRID_API_KEY) {
      await sendMail({
        to: account.email,
        subject: "Réinitialisation de votre mot de passe FONAREV",
        html: `<p>Bonjour ${account.firstName || ""},</p><p>Vous pouvez réinitialiser votre mot de passe avec ce lien valable 10 minutes :</p><p><a href="${appResetURL}">${appResetURL}</a></p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`,
        message: `Réinitialisez votre mot de passe avec ce lien valable 10 minutes : ${appResetURL}`,
      });
    }

    const payload = {
      status: "Success",
      message: "Si ce compte existe, un lien de réinitialisation a été envoyé.",
    };

    if (process.env.NODE_ENV !== "production" || process.env.RETURN_RESET_TOKEN === "true") {
      payload.resetToken = resetToken;
      payload.resetURL = apiResetURL;
    }

    res.status(200).json(payload);
  } catch (err) {
    if (req.body && req.body.email) {
      await Account.findOneAndUpdate(
        { email: req.body.email },
        { $unset: { passwordResetToken: "", passwordResetExpires: "" } }
      );
    }
    res.status(500).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.updateMyPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, newPasswordConfirm } = req.body;
    if (!oldPassword || !newPassword || !newPasswordConfirm) {
      return res.status(400).json({
        status: "failed",
        message: "Vous devez fournir l'ancien mot de passe et le nouveau mot de passe.",
      });
    }

    const accountId = req.decoded?.id || req.decoded?.user?.id || req.decoded?.user?._id;
    const account = await Account.findById(accountId).select("+password");
    if (!account) {
      return res.status(401).json({
        status: "failed",
        message: "Utilisateur non trouvé.",
      });
    }

    if (!(await account.correctPassword(oldPassword, account.password))) {
      return res.status(401).json({
        status: "failed",
        message: "L'ancien mot de passe est incorrect.",
      });
    }

    account.password = newPassword;
    account.passwordConfirm = newPasswordConfirm;
    await account.save();

    const token = signToken(account._id);
    res.locals.auditAction = "update_password";
    res.locals.auditModule = "accounts";
    res.locals.auditResourceId = account._id;

    res.status(200).json({
      status: "Success",
      message: "Mot de passe changé avec succès",
      token,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const rawToken = req.params.token || req.body.token || req.query.token;
    if (!rawToken) {
      return res.status(400).json({
        status: "failed",
        message: "Token de réinitialisation manquant.",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const account = await Account.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!account) {
      return res.status(400).json({
        status: "failed",
        message: "Le token est invalide ou expiré.",
      });
    }

    account.password = req.body.password;
    account.passwordConfirm = req.body.passwordConfirm;
    account.passwordResetToken = undefined;
    account.passwordResetExpires = undefined;
    await account.save();

    const token = signToken(account._id);
    res.locals.auditAction = "reset_password";
    res.locals.auditModule = "accounts";
    res.locals.auditResourceId = account._id;

    res.status(200).json({
      status: "Success",
      message: "Mot de passe réinitialisé avec succès.",
      token,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};
