const { Schema, model, models } = require("mongoose");

let providerAndDates = new Schema({
  providerName: {
    type: String,
    required: true,
  },
  providerOpeningDate: {
    type: Date,
    required: true,
  },
});

let provider = new Schema({
  providerAndDates: [providerAndDates],
});

const providerOpeningDate =
  models.providerOpeningDate || model("providerOpeningDate", provider);

module.exports = providerOpeningDate;
