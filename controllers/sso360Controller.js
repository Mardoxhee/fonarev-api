const jwt = require('jsonwebtoken');
const Account = require('../models/sso360Model');
const { parseAccess } = require('../utils/sso360Access');
const { accessFor } = require('../middlewares/hrmAccess');
exports.exchange = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const requestId = require('crypto').randomUUID();
  const steps = [];
  const record = (stage, code, details = {}) => {
    const step = { stage, code, ...details };
    steps.push(step);
    console.info('[HRMS SSO360]', JSON.stringify({ requestId, ...step }));
  };
  const fail = (status, stage, code, message, details = {}) => {
    record(stage, code, details);
    return res.status(status).json({ message, diagnostic: { requestId, serverTime: new Date().toISOString(), steps } });
  };
  const secret = process.env.FONAREV360_JWT_SECRET;
  const base = process.env.FONAREV360_API_BASE_URL;
  if (!secret || secret === '...' || !base || !process.env.JWT_SECRET) return fail(503, 'configuration', 'SSO_NOT_CONFIGURED', 'La connexion 360 n’est pas configurée sur le backend HRMS.');
  const token = typeof req.body?.token === 'string' ? req.body.token.trim().replace(/^Bearer\s+/i, '') : null;
  if (typeof token !== 'string' || token.length > 32768) return fail(400, 'token', 'TOKEN_MISSING', 'Token 360 absent ou invalide.');
  let claims;
  try {
    claims = jwt.verify(token, secret, { algorithms: ['HS256'], ...(process.env.FONAREV360_JWT_ISSUER ? { issuer: process.env.FONAREV360_JWT_ISSUER } : {}), ...(process.env.FONAREV360_JWT_AUDIENCE ? { audience: process.env.FONAREV360_JWT_AUDIENCE } : {}) });
    record('signature', 'JWT_VERIFIED');
    if (!Number.isFinite(claims.exp)) return fail(401, 'claims', 'EXP_MISSING', 'Le token 360 ne contient pas de date d’expiration exploitable.');
    if (claims.iat != null && (!Number.isFinite(claims.iat) || claims.iat > Date.now() / 1000 + 30)) return fail(401, 'claims', 'IAT_CLOCK_MISMATCH', 'La date de génération du token est incompatible avec l’horloge du serveur HRMS.', { issuedAt: claims.iat, serverEpoch: Math.floor(Date.now() / 1000) });
    if (!Number.isSafeInteger(Number(claims.user?.id)) || Number(claims.user.id) <= 0) return fail(401, 'claims', 'USER_ID_MISSING', 'Identifiant utilisateur absent ou invalide dans le token signé (user.id attendu).');
  } catch (error) {
    const reason = error.name === 'TokenExpiredError' ? ['JWT_EXPIRED', 'Le token transmis à HRMS est expiré. Vérifiez que 360 transmet le token actuel.']
      : error.name === 'NotBeforeError' ? ['JWT_NOT_ACTIVE', 'Le token 360 n’est pas encore actif. Vérifiez les horloges des serveurs.']
      : error.message === 'invalid signature' ? ['JWT_SIGNATURE_MISMATCH', 'La signature 360 ne correspond pas à la clé configurée sur le backend HRMS. Vérifiez la clé et redémarrez le backend.']
      : error.message === 'invalid algorithm' ? ['JWT_ALGORITHM_MISMATCH', 'L’algorithme du token 360 ne correspond pas à HS256 attendu par HRMS.']
      : error.message?.startsWith('jwt audience') ? ['JWT_AUDIENCE_MISMATCH', 'L’audience du token ne correspond pas à la configuration HRMS.']
      : error.message?.startsWith('jwt issuer') ? ['JWT_ISSUER_MISMATCH', 'L’émetteur du token ne correspond pas à la configuration HRMS.']
      : ['JWT_INVALID_FORMAT', 'Le token 360 ne peut pas être vérifié : format du token ou configuration de clé incorrecte.'];
    return fail(401, 'signature', reason[0], reason[1], error.name === 'TokenExpiredError' ? { expiredAt: error.expiredAt?.toISOString() } : {});
  }
  let snapshot;
  try {
    const root = new URL(base);
    if (root.protocol !== 'https:' || root.username || root.password) throw new Error('Configuration URL');
    const code = process.env.FONAREV360_APPLICATION_CODE || 'FHRMS';
    const url = `${root.toString().replace(/\/$/, '')}/user/app/${encodeURIComponent(code)}/${encodeURIComponent(claims.user.id)}`;
    record('permissions', 'CORE_REQUEST_STARTED', { endpoint: '/user/app/{application}/{userId}', applicationCode: code });
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(15000) });
    record('permissions', 'CORE_RESPONSE', { httpStatus: response.status });
    if ([401, 403].includes(response.status)) return fail(response.status, 'permissions', 'CORE_ACCESS_DENIED', '360 a refusé la connexion ou l’accès à HRMS.');
    if (!response.ok) throw new Error('API indisponible');
    snapshot = await response.json();
  } catch { return fail(502, 'permissions', 'CORE_REQUEST_FAILED', 'Impossible de vérifier les habilitations auprès de 360. Vérifiez l’URL serveur, le réseau et le certificat TLS.'); }
  let access;
  try { access = parseAccess(snapshot, claims.user.id, process.env.FONAREV360_APPLICATION_ID || '19'); }
  catch (error) { return fail(403, 'permissions', 'CORE_IDENTITY_OR_ACCESS_REJECTED', error.message); }
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
    if (lifetime <= 0) return fail(401, 'session', 'JWT_EXPIRED_DURING_EXCHANGE', 'Token 360 expiré pendant la connexion.');
    const sessionToken = jwt.sign({ id: String(account._id), authProvider: 'fonarev360' }, process.env.JWT_SECRET, { expiresIn: lifetime, algorithm: 'HS256' });
    res.locals.auditActor = { id: account._id, firstName: account.firstName, lastName: account.lastName, email: account.email, role: account.role };
    res.locals.auditAction = 'login';
    record('session', 'SESSION_CREATED');
    res.json({ diagnostic: { requestId, steps }, expiresIn: lifetime, token: sessionToken, user: { id: account._id, externalId: account.externalId, nom: account.lastName, prenom: account.firstName, email: account.email, role: account.role }, access: accessFor(account) });
  } catch { return fail(500, 'account', 'ACCOUNT_SYNC_FAILED', 'Impossible de synchroniser le compte HRMS.'); }
};
