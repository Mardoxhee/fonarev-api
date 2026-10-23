const mongoose = require('mongoose');
const Agent = require('../models/agentModel');
const schema = new mongoose.Schema({_id:String,value:{type:Number,required:true}},{versionKey:false});
const Counter = mongoose.models.AgentMatriculeCounter || mongoose.model('AgentMatriculeCounter',schema);
const normalize = value => String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/Œ/g,'OE').replace(/AUXILLIAIRE/g,'AUXILIAIRE').replace(/[^A-Z0-9]/g,'');
const codes = [
 ['DIRECTEUR','221'],['SOUS DIRECTEUR','120'],
 ['CHEF DE DIVISION ECH2','217'],['CHEF DE DIVISION ECH1','116'],
 ['CHEF DE SERVICE ECH2','215'],['CHEF DE SERVICE ECH1','114'],
 ['CHEF DE BUREAU ECH2','213'],['CHEF DE BUREAU ECH1','112'],
 ['AGENT DE BUREAU ECH2','211'],['AGENT DE BUREAU ECH1','110'],
 ['AGENT AUXILIAIRE 1er CLASSE (SQ2)','209'],['AGENT AUXILIAIRE 2ème CLASSE (SQ1)','108'],
 ['TRAVAILLEUR QUALIFIE','107'],['TRAVAILLEUR SEMI QUALIFIE 03','306'],
 ['TRAVAILLEUR SEMI QUALIFIE 02','205'],['TRAVAILLEUR SEMI QUALIFIE 01','104'],
 ['MANOEUVRE SPECIALISE','103'],['MANOEUVRE LOURD','020'],['MANOEUVRE ORDINAIRE','010']
];
function exemption(label) {
 const key=normalize(label);
 return ['CONSULTANT','DIRECTEURGENERAL','DIRECTEURGENERALADJOINT'].includes(key);
}
function gradeCode(label){
 const key=normalize(label).replace(/ECHELON/g,'ECH').replace(/1ERE/g,'1ER').replace(/2EME/g,'2');
 const match=codes.find(([name])=>normalize(name).replace(/2EME/g,'2')===key);
 if(!match)throw new Error('Ce grade ne possède pas de code matricule reconnu. Vérifiez son libellé.');
 return match[1];
}
function prefix(grade,sexe){if(!['M','F'].includes(sexe))throw new Error('Sélectionnez le sexe M ou F.');return gradeCode(grade)+sexe;}
function sequence(matricule){const match=/^\d{3}[MF](\d+)$/.exec(matricule||'');return match?Number(match[1]):0;}
async function latestSequence(){
 const latest=await Agent.findOne({matricule:/^\d{3}[MF]\d+$/}).sort({_id:-1}).select('matricule').lean();
 const value=sequence(latest?.matricule);if(!Number.isSafeInteger(value))throw new Error('Dernier numéro de matricule invalide.');
 return value;
}
async function preview(grade,sexe){
 if(exemption(grade))return null;
 const start=prefix(grade,sexe);const [last,counter]=await Promise.all([latestSequence(),Counter.findById('agents').lean()]);
 return start+String(Math.max(last,counter?.value||0)+1).padStart(3,'0');
}
async function allocate(grade,sexe){
 if(exemption(grade))return null;
 const start=prefix(grade,sexe),last=await latestSequence();
 let counter;
 for(let attempt=0;attempt<3;attempt++){
  try{counter=await Counter.findOneAndUpdate({_id:'agents'},[{$set:{value:{$add:[{$max:[{$ifNull:['$value',0]},last]},1]}}}],{upsert:true,new:true});break;}
  catch(error){if(error.code!==11000||attempt===2)throw error;}
 }
 if(!Number.isSafeInteger(counter.value))throw new Error('Numéro de matricule hors limite.');
 return start+String(counter.value).padStart(3,'0');
}
module.exports={exemption,gradeCode,sequence,preview,allocate,codes};
