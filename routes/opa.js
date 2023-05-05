const express = require("express");
const router = express.Router();
const applicantsInfo = require("../models/application");
const scholarships = require("../models/scholarship");
const { AsyncParser } = require("@json2csv/node");
const PDFDocument = require("pdfkit-table");

let options = {};

router.get("/search", async (req, res) => {
  const searchParam = req.query.searchParam;
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;

  try {
    const query = {
      $and: [
        { approvalStatus: "SCHOLAR" },
        {
          $or: [
            { firstName: { $regex: searchParam, $options: "i" } },
            { lastName: { $regex: searchParam, $options: "i" } },
            { course: { $regex: searchParam, $options: "i" } },
            { studentNum: { $regex: searchParam, $options: "i" } },
            { approvalStatus: { $regex: searchParam, $options: "i" } },
          ],
        },
      ],
    };

    const applicants = await applicantsInfo
      .find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // * Get provider names and dateGiven
    const providerNamesAndDateGiven = await scholarships.find().exec();

    // * Get total documents in the collection
    const count = await applicantsInfo.countDocuments(query);

    // * Calculate total pages
    const totalPages = Math.ceil(count / limit) || 1;

    if (!applicants) {
      res.status(200).json({
        applicants,
        totalPages,
        currentPage: page,
        limit,
        totalCount: count,
        providerNamesAndDateGiven,
      });
    }

    res.status(200).json({
      applicants,
      totalPages,
      currentPage: page,
      limit,
      totalCount: count,
      providerNamesAndDateGiven,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// * Generate Report
router.get("/generate-csv", async (req, res) => {
  // let { startDate, endDate } = req.body;

  // if (!startDate || !endDate)
  //   return res.status(400).json({ error: "Please provide a start date and end date" });

  let startDate = "2023-05-04";
  let endDate = "2023-05-05";
  let startDateCopy = startDate;
  let endDateCopy = endDate;

  startDate = new Date(startDate);
  endDate = new Date(endDate);

  const dataToGenerate = await applicantsInfo
    .find({
      $and: [{ approvalStatus: "SCHOLAR" }, { dateOfBecomingScholar: { $gte: startDate, $lte: endDate } }],
    })
    .sort({ dateOfBecomingScholar: 1 })
    .select({
      _id: 0,
      scholarshipProvider: 1,
      dateOfBecomingScholar: 1,
      firstName: 1,
      middleName: 1,
      lastName: 1,
      studentNum: 1,
      course: 1,
      college: 1,
      dateApplied: 1,
      currentGwa: 1,
      year: 1,
    })
    .exec();

  if (!dataToGenerate) return res.status(400).json({ error: "No data to generate" });

  // * Make an array consisting unique dateOfBecomingScholar
  let scholarships = [];

  dataToGenerate.forEach((data) => {
    if (
      !scholarships.some(
        (e) =>
          e.program ===
          `${data.scholarshipProvider} |  ${data.dateOfBecomingScholar
            .toISOString()
            .split("T")[0]
            .trim()
            .replace(/-/g, "/")}`
      )
    ) {
      scholarships.push({
        program: `${data.scholarshipProvider} |  ${data.dateOfBecomingScholar
          .toISOString()
          .split("T")[0]
          .trim()
          .replace(/-/g, "/")}`,
        totalScholars: 0,
        students: [],
      });
    }
  });

  // * Populate providersNameAndDateGiven with data

  scholarships.forEach((data) => {
    // * Get data from dataToGenerate
    dataToGenerate.forEach((innerData) => {
      if (
        data.program.split("|")[0].trim() === innerData.scholarshipProvider &&
        data.program.split("|")[1].trim() ===
          innerData.dateOfBecomingScholar.toISOString().split("T")[0].trim().replace(/-/g, "/")
      ) {
        const dataToPush = {
          "Student Name": `${innerData.firstName} ${innerData.middleName} ${innerData.lastName}`,
          "Student No.": innerData.studentNum,
          Course: `${innerData.course} `,
          Year: `${innerData.year}`,
          "Date Application": innerData.dateApplied.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          GWA: innerData.currentGwa,
        };
        data.students.push(dataToPush);
        data.totalScholars++;
      }
    });
  });

  // * Sort the data in providersNameAndDateGiven by GWA
  scholarships.forEach((data) => {
    data.students.sort((a, b) => {
      return a.currentGwa - b.currentGwa;
    });
  });

  // * Get total scholars
  let totalScholars = 0;
  scholarships.forEach((data) => {
    totalScholars += data.totalScholars;
  });

  let csvData = `START DATE - ${startDateCopy} | END DATE - ${endDateCopy} | TOTAL SCHOLARS: ${totalScholars}\n\n`;

  for (let i = 0; i < scholarships.length; i++) {
    const scholarship = scholarships[i];
    csvData += `${scholarship.program.replace(/\|/g, "-")},,,,, Total ${scholarship.program
      .split("|")[0]
      .trim()} Scholars: ${scholarship.totalScholars}\n`;
    const opts = {};
    const transformOpts = {};
    const parser = new AsyncParser(opts, transformOpts);
    csvData += (await parser.parse(scholarship.students).promise()) + "\n\n";
  }

  res.setHeader("Content-Disposition", "attachment; filename=scholarships.csv");
  res.set("Content-Type", "text/csv; charset=utf-8");
  res.status(200).send(csvData);
});

// * Default
router.get("/*", async (req, res) => {
  // * LIFO (Last In First Out)

  const initialOption = await scholarships.findOne().sort({ _id: -1 }).exec();

  if (initialOption && (req.query.provider === undefined || req.query.dateGiven === undefined)) {
    options = {
      approvalStatus: "SCHOLAR",
      scholarshipProvider: initialOption.providerName,
      dateOfBecomingScholar: initialOption.dateGiven[initialOption.dateGiven.length - 1].date,
    };
  } else {
    options = {
      approvalStatus: "SCHOLAR",
      scholarshipProvider: req.query.provider,
      dateOfBecomingScholar: req.query.dateGiven,
    };
  }

  // * Get provider names and dateGiven
  const providerNamesAndDateGiven = await scholarships.aggregate([
    // Unwind the openingDates array
    { $unwind: "$dateGiven" },

    // Sort by date in ascending order
    { $sort: { "dateGiven.date": -1 } },

    // Group by scholarship provider and reconstruct the openingDates array
    {
      $group: {
        _id: "$_id",
        providerName: { $first: "$providerName" },
        dateGiven: { $push: "$dateGiven" },
      },
    },
  ]);

  const page = req.query.page || 1;
  const limit = req.query.limit || 10;

  try {
    // * Create query object based on options
    const query = {
      $and: [
        { approvalStatus: options.approvalStatus },
        { scholarshipProvider: options.scholarshipProvider },
        { dateOfBecomingScholar: options.dateOfBecomingScholar },
      ],
    };

    // * execute query with page and limit values
    const applicants = await applicantsInfo
      .find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // * get total documents in the Posts collection
    const count = await applicantsInfo.countDocuments({ $and: [options] });

    // * Calculate total pages
    const totalPages = Math.ceil(count / limit) || 1;

    // * return response with posts, total pages, and current page
    res.status(200).json({
      applicants,
      totalPages,
      currentPage: page,
      limit,
      totalCount: count,
      providerNamesAndDateGiven,
    });
  } catch (e) {
    res.status(500).json(e.message);
  }
});

module.exports = router;
