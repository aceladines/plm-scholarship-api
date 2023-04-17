const express = require("express");
const app = express();
applicantsInfo = require("../models/application");

// Sub routes
const pendingRouter = require("./admin-sub-routes/pending");
app.use("/pending", pendingRouter);

const completedReqRouter = require("./admin-sub-routes/completed-requirements");
app.use("/completed-requirements", completedReqRouter);

const candidateRouter = require("./admin-sub-routes/candidate-students");
app.use("/candidate-students", candidateRouter);

const scholarRouter = require("./admin-sub-routes/scholar");
app.use("/scholar", scholarRouter);

module.exports = app;
