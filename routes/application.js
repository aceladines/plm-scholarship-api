const express = require("express");
const { celebrate, Joi, errors, Segments } = require("celebrate");
const router = express.Router();
const ApplicationForm = require("../models/application");
const fileUpload = require("../utils/file-upload");
const fileUpdate = require("../utils/file-update");
const fileDelete = require("../utils/file-delete");
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
  async (req, res, next) => {
    try {
      const { email, studentNum } = req.body;

      // Check if the email or student number is already in use
      const [emailExist, studentNumExist] = await Promise.all([
        ApplicationForm.findOne({ email }),
        ApplicationForm.findOne({ studentNum }),
      ]);

      if (emailExist) {
        throw new Error("Email already in use");
      }

      if (studentNumExist) {
        throw new Error("Student number already in use");
      }

      // If neither email nor student number is in use, proceed to the next middleware
      next();
    } catch (error) {
      // Return a 400 error if an error occurred
      res.status(400).json({ error: error.message });
    }
  },
  async (req, res) => {
    try {
      req.body.applied = true;
      req.body.dateApplied = new Date().toISOString();

      // Upload the files to Azure first to get the link of each file
      const fileInfos = await fileUpload(req.files, req.body.email);

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
      filesToDelete: Joi.string().allow("").optional(),
    }),
  }),
  async (req, res) => {
    try {
      // Applicant information
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
      };

      let updatedFiles = {};

      if (req.body.filesToDelete) {
        //Delete files
        updatedDeletedFiles = await fileDelete(
          req.body.email,
          JSON.parse(req.body.filesToDelete)
        );

        if (!updatedDeletedFiles) {
          res.status(400).json({ error: "File deletion failed" });
        }
      }

      if (req.files) {
        //Updated fileInfos
        updatedFiles = await fileUpdate(req.body.email, req.files);

        if (!updatedFiles) {
          res.status(400).json({ error: "File upload failed" });
        }
      }

      //Retrieve the current files object from the database
      const currentFiles = (
        await ApplicationForm.findOne({ email: req.body.email }, { files: 1 })
      ).files.toObject({
        getters: true,
        virtuals: false,
      });

      //Merge the current files object with the updated files object from the request body
      const mergedFiles = Object.assign({}, currentFiles, updatedFiles);

      //Update the information of the user application
      let update = await ApplicationForm.findOneAndUpdate(
        { email: req.body.email },
        { $set: { ...applicant, files: mergedFiles } },
        { new: true, upsert: true }
      );

      if (update) res.status(200).json({ message: "Update successful!" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
