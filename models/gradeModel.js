const mongoose = require("mongoose");

const gradeSchema = new mongoose.Schema({
  libele: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
  salaire: Number,
  perdiem: Number, 
  autre: String, 
  conge: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  
});

const Grade = mongoose.model("Grade", gradeSchema);
module.exports = Grade;
