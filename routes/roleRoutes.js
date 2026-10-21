const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../controllers/authController");
const {
  createRole,
  getRoles,
  getRole,
  updateRole,
  deleteRole,
} = require("../controllers/roleController");

router.use(protect, restrictTo("admin", "administrateur", "superadmin", "rh", "drh", "dg"));

const { MODULES } = require('../middlewares/hrmAccess');
router.get('/', (req, res) => res.json({ roles: [
  { _id: 'rh_owner', code: 'rh_owner', name: 'RH OWNER', description: 'Tous les droits sur l’application.', permissions: MODULES.map(module => ({ module, actions: ['read', 'create', 'update', 'delete'] })), active: true, system: true },
  { _id: 'rh_reader', code: 'rh_reader', name: 'RH READER', description: 'Lecture de tous les modules.', permissions: MODULES.map(module => ({ module, actions: ['read'] })), active: true, system: true },
  { _id: 'superadmin', code: 'superadmin', name: 'SUPERADMIN', description: 'Tous les droits sur la plateforme.', permissions: MODULES.map(module => ({ module, actions: ['read', 'create', 'update', 'delete'] })), active: true, system: true },
  { _id: 'invite', code: 'invite', name: 'INVITÉ', description: 'Lecture des modules autorisés sur chaque fiche utilisateur.', permissions: [], active: true, system: true },
] }));
router.all(['/', '/:id'], (req, res) => res.status(403).json({ message: 'Les quatre rôles système sont fixes. Configurez les modules des invités dans leur fiche utilisateur.' }));

module.exports = router;
