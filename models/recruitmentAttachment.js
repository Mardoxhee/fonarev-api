const mongoose = require('mongoose');
// Files stay private in MongoDB; never served by a public static directory.
const schema = new mongoose.Schema({
  candidature: {type: mongoose.Schema.Types.ObjectId, required:true, index:true},
  label: String,
  requirementKey: String,
  data: {type:Buffer, required:true, select:false}
},{timestamps:true});
module.exports = mongoose.model('RecruitmentAttachment',schema);
