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
      wordLink: {
        type: String,
      },
      remarks:[
        {
          type: String,
        }
      ]
    },
  ],
});

const openingModel = models.openings || model("openings", openings);

module.exports = openingModel;
