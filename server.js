require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const rateLimiterMiddleware = require("./middlewares/rate-limiter");
const { celebrate, Joi, errors, Segments } = require("celebrate");
const mongoString = process.env.ATLAS_URI || process.env.MONGO_URI;
const cors = require("cors");
const helmet = require("helmet");
const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", true);

mongoose.set("strictQuery", true);
mongoose.connect(mongoString);
const database = mongoose.connection;
const port = process.env.PORT || 8000;

// Will run once if DB is initialized and connected successfully.
database.once("connected", () => {
  console.log("Database Connected");
});

// * Rate Limiter
// app.use(rateLimiterMiddleware);

//Routes
const applicationRouter = require("./routes/application");
app.use("/application", applicationRouter);

const applicantsRouter = require("./routes/applicants");
app.use("/applicants", applicantsRouter);

const adminRouter = require("./routes/admin");
app.use("/admin", adminRouter);

const committee = require("./routes/committee");
app.use("/committee", committee);


// Get error message from Joi Validator
app.use(errors());

// If endpoint does not exist will return an error message
app.use(function (req, res) {
  res.status(404).send({
    error: {
      errors: [
        {
          domain: "global",
          reason: "notFound",
          message: "Not Found",
          description:
            "Couldn't find the requested resource '" + req.originalUrl + "'",
        },
      ],
      code: 404,
      message: "Not Found! Please check your endpoint.",
    },
  });
});

app.listen(port, () => {
  console.log(`Server Started at ${port},`);
});
