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
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(401).json("token_not_valid");
      } else {
        req.decoded = decoded;

        const expiresIn = 24 * 60 * 60;
        const newToken = jwt.sign(
          {
            user: decoded.user,
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

// exports.restrictTo = (roles) => {
//   return async (req, res, next) => {
//     await Account.findById(req.decoded.id).then(async (account) => {
//       if (!roles.includes(account.role)) {
//         return res.status(403).json({
//           status: "fail",
//           message: "you do not have permission to do this action",
//         });
//       }
//       if (data.role === "user") {
//         await Restaurant.findById(req.params.id).then((restaurant) => {
//           if (restaurant.account !== req.decoded.id) {
//             return res.status(403).json({
//               status: "fail",
//               message: "unauthorized",
//             });
//           }
//         });
//       }
//     });
//     next();
//   };
// };

exports.forgotPassword = async (req, res, next) => {
  // 1) get Account based on posted email

  const account = await Account.findOne({ email: req.body.email });
  if (!account) {
    return res
      .status(404)
      .json({ messagestatus: "failed", message: "no account with this email" });
  }

  // 2) generate the random token for t

  const resetToken = account.createPasswordResetToken();
  await account.save({ validateBeforeSave: false });
  // Send it to account's email address
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/accounts/resetPassword/${resetToken}`;
  const message = `forgot your password? submit a PATCH request to your new password and passwordConfirm to : ${resetURL}.\n if you didn't forget it, plz ignore this message`;
  try {
    await sendEMail({
      email: account.email,
      subject: "your password reset token (valid for 10minutes)",
      message,
    });
    res.status(200).json({ status: "success", message: "token sent to mail" });
  } catch (err) {
    Account.passwordResetToken = undefined;
    Account.passwordResetExpires = undefined;
    await account.save({ validateBeforeSave: false });
    return res
      .status(500)
      .json({ status: "failed", message: "error while sending email" });
  }
};

exports.resetPassword = async (req, res, next) => {
  // 1) get account based on the resetToken
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const account = await user.fidOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) if token has has not expired, and there is account, set the new password
  if (!account) {
    return reqres
      .status(400)
      .json({ status: "failed,", message: "token is invalid or expired" });
  }
  account.password = req.body.password;
  account.passwordConfirm = req.body.passwordConfirm;
  account.passwordResetToken = undefined;
  account.passwordResetExpires = undefined;
  await user.save();

  const token = signToken(user._id);
  res.status(200).json({ status: "success", token });
};