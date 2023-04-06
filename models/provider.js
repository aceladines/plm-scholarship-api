const { Schema, model, models } = require("mongoose");

// let providerOpeningDate = new Schema({
//   date: {
//     type: String,
//     required: true,
//   },
// });

// let providerAndDates = new Schema({
//   providerName: {
//     type: String,
//     required: true,
//   },
//   providerOpeningDate: [providerOpeningDate],
// });

// let provider = new Schema({
//   providerAndDates: {
//     type: [providerAndDates],
//     required: true,
//   },
// });

let provider = new Schema({
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
  becomingScholarDates: [
    {
      date: {
        type: String,
        required: true,
      },
    },
  ],
});

const providerModel = models.provider || model("provider", provider);

module.exports = providerModel;
