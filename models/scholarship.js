const { Schema, model, models } = require("mongoose");

let scholarships = new Schema({
  providerName: {
    type: String,
    required: true,
  },
  dateGiven: [
    {
      date: {
        type: String,
        required: true,
      }
    },
  ],
});

const scholarshipModel = models.scholarships || model("scholarships", scholarships);

module.exports = scholarshipModel;
