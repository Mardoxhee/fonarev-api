const Role = require("../models/roleModel");

const normalizePermissions = (permissions) => {
  if (!Array.isArray(permissions)) return [];
  return permissions
    .map((permission) => ({
      module: String(permission.module || "").trim(),
      actions: Array.isArray(permission.actions)
        ? permission.actions.map((action) => String(action).trim()).filter(Boolean)
        : [],
    }))
    .filter((permission) => permission.module);
};

const rolePayload = (body, accountId) => ({
  name: body.name || body.nom || body.label,
  code: body.code,
  description: body.description || "",
  permissions: normalizePermissions(body.permissions),
  active: body.active !== undefined ? body.active : true,
  account: accountId,
});

exports.createRole = async (req, res) => {
  try {
    const role = await Role.create(rolePayload(req.body, req.decoded && req.decoded.id));
    res.status(201).json({
      status: "Success",
      role,
    });
  } catch (error) {
    res.status(400).json({
      status: "failed",
      message: error.message,
    });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const query = {};
    if (req.query.active !== undefined) query.active = String(req.query.active) === "true";
    if (req.query.search) {
      const regex = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ name: regex }, { code: regex }, { description: regex }];
    }

    const roles = await Role.find(query).sort("name").populate("account", "firstName lastName email role");
    res.status(200).json({
      status: "Success",
      numberOfRoles: roles.length,
      roles,
    });
  } catch (error) {
    res.status(400).json({
      status: "failed",
      message: error.message,
    });
  }
};

exports.getRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).populate("account", "firstName lastName email role");
    if (!role) {
      return res.status(404).json({
        status: "failed",
        message: "Rôle introuvable",
      });
    }
    res.status(200).json({
      status: "Success",
      role,
    });
  } catch (error) {
    res.status(400).json({
      status: "failed",
      message: error.message,
    });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndUpdate(req.params.id, rolePayload(req.body, req.decoded && req.decoded.id), {
      new: true,
      runValidators: true,
    });
    if (!role) {
      return res.status(404).json({
        status: "failed",
        message: "Rôle introuvable",
      });
    }
    res.status(200).json({
      status: "Success",
      role,
    });
  } catch (error) {
    res.status(400).json({
      status: "failed",
      message: error.message,
    });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({
        status: "failed",
        message: "Rôle introuvable",
      });
    }
    if (role.system) {
      return res.status(400).json({
        status: "failed",
        message: "Ce rôle système ne peut pas être supprimé.",
      });
    }
    await Role.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: "Role deleted successfully",
      data: null,
    });
  } catch (error) {
    res.status(400).json({
      status: "failed",
      message: error.message,
    });
  }
};
