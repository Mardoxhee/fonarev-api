const mongoose = require('mongoose');
// New files use MinIO; buffers are retained only for legacy attachments.
const schema = new mongoose.Schema({
  candidature: {type: mongoose.Schema.Types.ObjectId, required:true, index:true},
  label: String,
  requirementKey: String,
  storageKey: {type:String, select:false},
  originalName: String,
  size: Number,
  data: {type:Buffer, select:false}
},{timestamps:true});
module.exports = mongoose.model('RecruitmentAttachment',schema);
