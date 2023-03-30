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
      approvalStatus: Joi.string().trim().required(),
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

      const files = {
        scholarshipForm: {
          fileName: fileInfos.fileName[0],
          filePath: fileInfos.filePath[0],
        },
        form137_138: {
          fileName: fileInfos.fileName[1],
          filePath: fileInfos.filePath[1],
        },
        IncomeTax: {
          fileName: fileInfos.fileName[2],
          filePath: fileInfos.filePath[2],
        },
        SnglParentID: {
          fileName: fileInfos.fileName[3],
          filePath: fileInfos.filePath[3],
        },
        CoR: {
          fileName: fileInfos.fileName[4],
          filePath: fileInfos.filePath[4],
        },
        CGM: {
          fileName: fileInfos.fileName[5],
          filePath: fileInfos.filePath[5],
        },
        ScholarshipLetter: {
          fileName: fileInfos.fileName[6],
          filePath: fileInfos.filePath[6],
        },
        PlmID: {
          fileName: fileInfos.fileName[7],
          filePath: fileInfos.filePath[7],
        },
      };

      req.body.files = files;

      // Upload data to MongoDB
      const application = await ApplicationForm.create(req.body, files);

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
      approvalStatus: Joi.string().trim().required(),
    }),
  }),
  async (req, res) => {
    try {
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
      };
      //Update the information of the user application
      const updateInfo = await ApplicationForm.findOneAndUpdate(
        { email: req.body.email },
        { $set: applicant },
        { new: true }
      );

      if (updateInfo) {
        // Delete the files to be updated first
        const updateFiles = await fileUpdate(req.body.email, req.files);
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
