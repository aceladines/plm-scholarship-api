const { Schema, model, models } = require("mongoose");

const remarkSchema = new Schema({
  email: {
    type: String,
  },
  dateSigned: {
    type: String,
  },
  status: {
    type: String,
  },
});

const openings = new Schema({
  providerName: {
    type: String,
    required: true,
  },
  openingDates: [
    {
      date: {
        type: String,
        required: true,
      },
      wordLink: {
        type: String,
      },
      remarks: [remarkSchema],
    },
  ],
});

const openingModel = models.openings || model("openings", openings);

module.exports = openingModel;
