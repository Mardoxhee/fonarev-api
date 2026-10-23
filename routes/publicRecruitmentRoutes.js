const express = require('express');
const Offre = require('../models/offreEmploiModel');
const router = express.Router();

// Explicit public projection: never expose authors, history or internal forms.
const fields = '_id titre reference contractType direction lieuAffectation resume description missions profilRecherche piecesRequises nombrePostes dateCloture statut isActive minExperienceYears educationLevel requiredExperiences studyFields technicalSkills softSkills languages certifications tools screeningQuestions';
const openOffers = () => ({ statut: 'publie', isActive: true, dateCloture: { $gt: new Date() } });
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.get('/offres', async (req, res) => {
  try {
    const positive = (value, fallback, max) => { const number = Number(value); return Number.isSafeInteger(number) && number > 0 ? Math.min(number, max) : fallback; };
    const page = positive(req.query.page, 1, 100000);
    const limit = positive(req.query.limit, 12, 100);
    const filter = openOffers();
    if (typeof req.query.q === 'string' && req.query.q.trim()) {
      const text = escapeRegex(req.query.q.trim().slice(0, 200));
      filter.$or = ['titre', 'reference', 'direction', 'lieuAffectation'].map(key => ({ [key]: { $regex: text, $options: 'i' } }));
    }
    if (typeof req.query.contractType === 'string' && req.query.contractType) filter.contractType = req.query.contractType.slice(0, 50);
    const [offres, total] = await Promise.all([
      Offre.find(filter).select(fields).sort({ datePublication: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Offre.countDocuments(filter)
    ]);
    res.json({ offres, total, page, limit });
  } catch (error) { res.status(503).json({ message: 'Les offres sont temporairement indisponibles.' }); }
});
router.get('/offres/:id', async (req, res) => {
  if (!/^[a-f0-9]{24}$/i.test(req.params.id)) return res.status(404).json({ message: 'Offre introuvable.' });
  try {
    const offre = await Offre.findOne({ ...openOffers(), _id: req.params.id }).select(fields).lean();
    if (!offre) return res.status(404).json({ message: 'Offre introuvable.' });
    res.json({ offre });
  } catch (error) { res.status(503).json({ message: 'Cette offre est temporairement indisponible.' }); }
});
const applications = require('../controllers/publicApplicationController');
router.post('/candidatures', applications.receive, applications.create);
module.exports = router;
