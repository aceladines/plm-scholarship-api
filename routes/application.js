const express = require("express");
const { celebrate, Joi, errors, Segments } = require("celebrate");
const router = express.Router();
const ApplicationForm = require("../models/application");
const fileUpload = require("../utils/file-upload");
const fileUpdate = require("../utils/file-update");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/",
  upload.array("pdf", 10),
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      studentNum: Joi.string().trim().required(),
      firstName: Joi.string().trim().required(),
      middleName: Joi.string().trim().allow("").optional(),
      lastName: Joi.string().trim().required(),
      gender: Joi.string().trim().required(),
      email: Joi.string().trim().email().required(),
      college: Joi.string().trim().required(),
      course: Joi.string().trim().required(),
      year: Joi.number().required(),
      mobileNum: Joi.number().required(),
      birthdate: Joi.string().trim().required(),
      householdIncome: Joi.number().required(),
      currentGwa: Joi.number().required(),
      applied: Joi.boolean().required(),
      approvalStatus: Joi.string().trim(),
    }),
  }),
  (req, res, next) => {
    // Check if the email || student number already in use, if yes return credential error
    ApplicationForm.findOne({ email: req.body.email })
      .then((emailExist) => {
        if (emailExist) {
          throw new Error("Email already in use");
        }
        return ApplicationForm.findOne({ studentNum: req.body.studentNum });
      })
      .then((studentNumExist) => {
        if (studentNumExist) {
          throw new Error("Student number already in use");
        }
        next();
      })
      .catch((error) => {
        return res.status(400).json({ error: error.message });
      });
  },
  async (req, res) => {
    try {
      req.body.applied = true;
      req.body.dateApplied = new Date().toISOString();

      // Upload the files to Azure first to get the link of each file
      const fileInfos = await fileUpload(req.files, req.body.email);

      console.log(fileInfos);

      req.body.files = fileInfos;

      // Upload data to MongoDB
      const application = await ApplicationForm.create(req.body);

      return res
        .status(200)
        .json({ message: "Application successful", application });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
);

router.put(
  "/update",
  upload.array("pdf", 10),
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      studentNum: Joi.string().trim(),
      firstName: Joi.string().trim(),
      middleName: Joi.string().trim().allow("").optional(),
      lastName: Joi.string().trim(),
      gender: Joi.string().trim(),
      email: Joi.string().trim().email().required(),
      college: Joi.string().trim(),
      course: Joi.string().trim(),
      year: Joi.number(),
      mobileNum: Joi.number(),
      birthdate: Joi.string().trim(),
      householdIncome: Joi.number(),
      currentGwa: Joi.number(),
      applied: Joi.boolean(),
      approvalStatus: Joi.string().trim(),
    }),
  }),
  async (req, res) => {
    try {
      //Updated fileInfos
      const updateFiles = await fileUpdate(req.body.email, req.files);

      //Applicant information
      const applicant = {
        studentNum: req.body.studentNum,
        firstName: req.body.firstName,
        middleName: req.body.middleName,
        lastName: req.body.lastName,
        gender: req.body.gender,
        college: req.body.college,
        course: req.body.course,
        year: req.body.year,
        mobileNum: req.body.mobileNum,
        birthdate: req.body.birthdate,
        householdIncome: req.body.householdIncome,
        currentGwa: req.body.currentGwa,
        files: updateFiles,
      };

      //Update the information of the user application
      const updateInfo = await ApplicationForm.findOneAndUpdate(
        { email: req.body.email },
        { $set: applicant },
        { new: true }
      );

      if (updateInfo) {
        res
          .status(200)
          .json({ message: "Update successful", updateInfo, updateFiles });
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
