const { Schema, model, models } = require("mongoose");

const superUSerSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
});

const superUserModel =
  models.superusers || model("superusers", superUSerSchema);

module.exports = superUserModel;
