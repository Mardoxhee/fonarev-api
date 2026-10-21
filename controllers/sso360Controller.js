const jwt = require('jsonwebtoken');
const Account = require('../models/sso360Model');
const { parseAccess } = require('../utils/sso360Access');
const { accessFor } = require('../middlewares/hrmAccess');
exports.exchange = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const secret = process.env.FONAREV360_JWT_SECRET;
  const base = process.env.FONAREV360_API_BASE_URL;
  if (!secret || secret === '...' || !base || !process.env.JWT_SECRET) return res.status(503).json({ message: 'La connexion 360 n’est pas configurée sur le backend HRMS.' });
  const token = req.body?.token;
  if (typeof token !== 'string' || token.length > 32768) return res.status(400).json({ message: 'Token 360 absent ou invalide.' });
  let claims;
  try {
    claims = jwt.verify(token, secret, { algorithms: ['HS256'], ...(process.env.FONAREV360_JWT_ISSUER ? { issuer: process.env.FONAREV360_JWT_ISSUER } : {}), ...(process.env.FONAREV360_JWT_AUDIENCE ? { audience: process.env.FONAREV360_JWT_AUDIENCE } : {}) });
    if (!Number.isFinite(claims.exp) || !Number.isFinite(claims.iat) || claims.iat > Date.now() / 1000 + 30 || !Number.isSafeInteger(Number(claims.user?.id)) || Number(claims.user.id) <= 0) throw new Error();
  } catch { return res.status(401).json({ message: 'Token 360 invalide ou expiré. Relancez HRMS depuis 360.' }); }
  let snapshot;
  try {
    const root = new URL(base);
    if (root.protocol !== 'https:' || root.username || root.password) throw new Error('Configuration URL');
    const code = process.env.FONAREV360_APPLICATION_CODE || 'FHRMS';
    const url = `${root.toString().replace(/\/$/, '')}/user/app/${encodeURIComponent(code)}/${encodeURIComponent(claims.user.id)}`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(15000) });
    if ([401, 403].includes(response.status)) return res.status(response.status).json({ message: '360 a refusé la connexion ou l’accès à HRMS.' });
    if (!response.ok) throw new Error('API indisponible');
    snapshot = await response.json();
  } catch { return res.status(502).json({ message: 'Impossible de vérifier les habilitations auprès de 360. Réessayez depuis 360.' }); }
  let access;
  try { access = parseAccess(snapshot, claims.user.id, process.env.FONAREV360_APPLICATION_ID || '19'); }
  catch (error) { return res.status(403).json({ message: error.message }); }
  try {
    const { user, ...rights } = access;
    const filter = { provider: 'fonarev360', externalId: String(user.id) };
    const update = { ...rights, active: true, firstName: user.prenom || user.username || String(user.id), lastName: [user.nom, user.postnom].filter(Boolean).join(' ') || user.username || String(user.id), email: user.email || null, phone: user.telephone || null, syncedAt: new Date() };
    // Unique provider/id index also protects concurrent first logins.
    await Account.init();
    let account;
    try { account = await Account.findOneAndUpdate(filter, { $set: update }, { upsert: true, new: true, runValidators: true }); }
    catch (error) { if (error.code !== 11000) throw error; account = await Account.findOneAndUpdate(filter, { $set: update }, { new: true, runValidators: true }); }
    const lifetime = Math.min(300, Math.floor(claims.exp - Date.now() / 1000));
    if (lifetime <= 0) return res.status(401).json({ message: 'Token 360 expiré.' });
    const sessionToken = jwt.sign({ id: String(account._id), authProvider: 'fonarev360' }, process.env.JWT_SECRET, { expiresIn: lifetime, algorithm: 'HS256' });
    res.json({ expiresIn: lifetime, token: sessionToken, user: { id: account._id, externalId: account.externalId, nom: account.lastName, prenom: account.firstName, email: account.email, role: account.role }, access: accessFor(account) });
  } catch { res.status(500).json({ message: 'Impossible de synchroniser le compte HRMS.' }); }
};
