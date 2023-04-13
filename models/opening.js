const { Schema, model, models } = require("mongoose");

let openings = new Schema({
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
    },
  ],
});

const openingModel = models.openings || model("openings", openings);

module.exports = openingModel;
