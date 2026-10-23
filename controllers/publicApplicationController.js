const mongoose = require('mongoose');
const crypto = require('crypto');
const multer = require('multer');
const validator = require('validator');
const Candidate = require('../models/candidatureSpont');
const Offer = require('../models/offreEmploiModel');
const Attachment = require('../models/recruitmentAttachment');
const { educationLevels } = require('../utils/recruitmentCriteria');
const fail = (message, status = 400, code = 'INVALID_APPLICATION') => Object.assign(new Error(message), { status, code });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5*1024*1024, files: 20, fields: 20, fieldSize: 100000, parts: 40 }, fileFilter(req,file,cb) { cb(null, file.mimetype === 'application/pdf' && /\.pdf$/i.test(file.originalname)); } }).any();
function validate(body, files, offer) {
  const text = (key,max,required=false) => { const value=body[key]; if (typeof value !== 'string' || value.trim().length>max || (required&&!value.trim())) throw fail('Champ invalide : '+key); return value.trim(); };
  const docs=offer.piecesRequises||[], questions=offer.screeningQuestions||[];
  if (!docs.length || docs.length>20) throw fail('Les documents de cette offre ne sont pas configurés.',409,'REQUIREMENTS_CHANGED');
  if (body.requirementsVersion !== JSON.stringify({documents:docs,questions})) throw fail('Les pièces ou questions ont changé. Rechargez l’offre.',409,'REQUIREMENTS_CHANGED');
  const nom=text('nom',120,true), prenom=text('prenom',120,true), email=text('email',254,true).toLowerCase(), phone=text('telephone',30,true);
  if (!validator.isEmail(email) || !/^[+\d\s().-]{6,30}$/.test(phone) || body.consent!=='on') throw fail('Coordonnées ou consentement invalides.');
  const years=text('experienceYears',10,true), experienceYears=Number(years);
  if (!Number.isFinite(experienceYears)||experienceYears<0||experienceYears>60||!educationLevels.slice(1).includes(body.educationLevel)) throw fail('Expérience ou niveau d’études invalide.');
  const parse=(key)=>{try{return JSON.parse(body[key]);}catch{throw fail('Champ invalide : '+key);}};
  const list=key=>{const values=parse(key);if(!Array.isArray(values)||values.length>100||values.some(v=>typeof v!=='string'||v.length>500))throw fail('Liste invalide : '+key);return [...new Set(values.map(v=>v.trim()).filter(Boolean))];};
  const answers=parse('reponsesFormulaire');
  if(!Array.isArray(answers)||answers.length!==questions.length)throw fail('Réponses de présélection incomplètes.');
  const reponsesFormulaire=questions.map((label,index)=>{const a=answers[index];if(a?.fieldName!=='question_'+index||typeof a.value!=='string'||!a.value.trim()||a.value.length>2000)throw fail('Réponse de présélection invalide.');return {fieldName:'question_'+index,label,value:a.value.trim()};});
  if(files.length!==docs.length||files.reduce((sum,f)=>sum+f.size,0)>15*1024*1024)throw fail('Pièces manquantes ou dossier supérieur à 15 Mo.');
  const ordered=docs.map((label,index)=>{const matches=files.filter(f=>f.fieldname==='piece_'+index);const f=matches[0];if(matches.length!==1||!f.size||f.size>5*1024*1024||f.buffer.subarray(0,5).toString()!=='%PDF-')throw fail('PDF manquant ou invalide : '+label);return {...f,label,requirementKey:'piece_'+index};});
  return {files:ordered,payload:{nom,prenom,email,phone,experienceYears,educationLevel:body.educationLevel,studyField:text('studyField',200),competences:list('competences'),certifications:list('certifications'),langues:list('langues').map(langue=>({langue,niveau:null})),reponsesFormulaire,motivation:text('motivation',5000),consentementDonnees:true,typeCandidature:'offre_emploi',statut:'nouvelle',offreEmploi:offer._id}};
}
exports.validate = validate;
// Coarse per-process upload limit; production proxy should also limit body size and rate.
const attempts=new Map();
exports.receive=(req,res,next)=>{
  const length=Number(req.headers['content-length']);
  if(!Number.isFinite(length)||length<=0||length>16*1024*1024)return res.status(413).json({message:'Le dossier dépasse la taille autorisée.'});
  const now=Date.now(), key=req.ip;
  for(const [ip,item] of attempts)if(item.until<now)attempts.delete(ip);
  const item=attempts.get(key)||{count:0,until:now+60000};item.count++;attempts.set(key,item);
  if(item.count>30||attempts.size>10000)return res.status(429).json({message:'Trop de tentatives. Réessayez plus tard.'});
  upload(req,res,error=>error?res.status(400).json({message:'Dossier trop volumineux ou format invalide.'}):next());
};
exports.create=async(req,res)=>{
  let session;
  try {
    if(!/^[a-f0-9]{24}$/i.test(req.body.offreId||''))throw fail('Offre introuvable.',410);
    // Ensure the unique index is ready before accepting concurrent submissions.
    await Candidate.init(); await Attachment.init();
    const indexes = await Candidate.collection.indexes();
    if (!indexes.some(index => index.unique && index.sparse && index.key.submissionKey === 1 && Object.keys(index.key).length === 1)) {
      throw fail('Le dépôt est temporairement indisponible.',503,'STORAGE_NOT_READY');
    }
    session=await mongoose.startSession();
    let reference;
    await session.withTransaction(async()=>{
      // A write locks the offer against concurrent closure / requirement changes.
      const offer=await Offer.findOneAndUpdate({_id:req.body.offreId,statut:'publie',isActive:true,dateCloture:{$gt:new Date()}},{$inc:{applicationSequence:1}},{new:true,session,timestamps:false}).lean();
      if(!offer)throw fail('Cette offre n’est plus ouverte.',410,'OFFER_CLOSED');
      const {payload,files}=validate(req.body,req.files||[],offer);
      if(await Candidate.exists({offreEmploi:offer._id,email:payload.email}).session(session))throw fail('Une candidature existe déjà pour cette adresse et cette offre.',409,'DUPLICATE_APPLICATION');
      const candidateId=new mongoose.Types.ObjectId();
      reference='FHR-'+crypto.randomUUID().toUpperCase();
      const documents=[];
      for(const file of files){
        const attachmentId=new mongoose.Types.ObjectId();
        await Attachment.create([{_id:attachmentId,candidature:candidateId,data:file.buffer,label:file.label,requirementKey:file.requirementKey}],{session});
        documents.push({type:'autre',label:file.label,requirementKey:file.requirementKey,url:'/candidatures/'+candidateId+'/documents/'+attachmentId});
      }
      const submissionKey=crypto.createHash('sha256').update(String(offer._id)+'|'+payload.email).digest('hex');
      await Candidate.create([{...payload,_id:candidateId,reference,submissionKey,documents}],{session});
    });
    return res.status(201).json({reference});
  } catch(error){
    const duplicate=error.code===11000;
    res.status(duplicate?409:error.status||503).json({code:duplicate?'DUPLICATE_APPLICATION':error.code==='REQUIREMENTS_CHANGED'?error.code:undefined,message:duplicate?'Une candidature existe déjà pour cette offre.':error.status?error.message:'Le dossier n’a pas pu être enregistré. Réessayez plus tard.'});
  } finally {if(session)await session.endSession();}
};
exports.download=async(req,res)=>{
  try {
    if(![req.params.id,req.params.documentId].every(v=>/^[a-f0-9]{24}$/i.test(v)))return res.sendStatus(404);
    const file=await Attachment.findOne({_id:req.params.documentId,candidature:req.params.id}).select('+data');
    if(!file)return res.sendStatus(404);
    res.set({'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="document.pdf"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});
    res.send(file.data);
  }catch{res.sendStatus(503);}
};
