const express = require("express");
// const { AsyncParser } = require("@json2csv/node");
const archiver = require("archiver");
const PDFDocument = require("pdfkit");
const { PassThrough } = require("stream");
const router = express.Router();
applicantsInfo = require("../../models/application");
provider = require("../../models/provider");

let csvData;

router.post("/to-scholar", async (req, res) => {
  const email = req.body.email;

  try {
    const moveToScholar = await applicantsInfo.findOneAndUpdate(
      { email },
      {
        dateOfBecomingScholar: new Date().toISOString(),
        approvalStatus: "SCHOLAR",
      },
      { new: true }
    );

    if (moveToScholar) {
      res.status(200).json({ message: "Applicant became a scholar!" });
    } else {
      res.status(400).json({ message: "Something went wrong!" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/generate-pdf", async (req, res) => {
  let data1 = [];
  let data2 = [];
  let data3 = [];

  for (const data of csvData) {
    data1.push({
      "Name of Candidate": `${data.firstName} ${data.middleName} ${data.lastName}`,
      "Degree Program": data.course,
      Rank: data.rank,
      Remarks: data.approvalStatus,
    });
  }

  for (const data of csvData) {
    data2.push({
      Name: `${data.firstName} ${data.middleName} ${data.lastName}`,
      Year: data.year,
      College: data.college,
      "Degree Program": data.course,
      Contact: data.mobileNum,
      GWA: data.currentGwa,
      Equiv: data.EquivGWA,
      "Parents' Household Income": data.householdIncome,
      Equiv: data.EquivInc,
      "Total Score": data.totalScore,
      Rank: data.rank,
    });
  }

  csvData.map((data, index) => {
    data3.push({
      No: index + 1,
      "Name of Candidate": `${data.firstName} ${data.middleName} ${data.lastName}`,
      "Degree Program": data.course,
      Rank: data.rank,
    });
  });

  const document1 = new PDFDocument();
  const document2 = new PDFDocument();
  const document3 = new PDFDocument();
  const archive = archiver("zip", {
    zlib: { level: 9 }, // Sets the compression level.
  });

  // Set the content type header to indicate that the response will contain a zip file
  res.setHeader("Content-Type", "application/zip");

  // Set the content disposition header to indicate that the response should be treated as an attachment
  res.setHeader("Content-Disposition", "attachment; filename=output.zip");

  // Pipe the compressed archive to the response object
  archive.pipe(res);

  // Function to generate table in PDF document
  const generateTable = (doc, data, headers, title) => {
    const tableWidth = 500; // Width of the table
    const marginLeft = (doc.page.width - tableWidth) / 2; // Calculate left margin to center the table

    doc.font("Helvetica-Bold");
    doc.fontSize(14);
    doc.text(title, { align: "center" });
    doc.moveDown(0.5);

    doc.font("Helvetica");
    doc.fontSize(12);

    // Table headers with borders and centered
    headers.forEach((header, index) => {
      doc.text(header, marginLeft + index * 150, doc.y, {
        align: "center",
        border: [true, true, true, true],
      });
    });

    doc.moveDown(0.5);

    // Table rows with borders and centered
    doc.font("Helvetica");
    doc.fontSize(11);
    data.forEach((row) => {
      headers.forEach((header, index) => {
        doc.text(row[header], marginLeft + index * 150, doc.y, {
          align: "center",
          border: [true, false, true, true],
        });
      });
      doc.moveDown(0.5);
    });
  };

    const headers1 = ["Name of Candidate", "Degree Program", "Rank", "Remarks"];
    const title1 = "REPORT";
    generateTable(document1, data1, headers1, title1);

    const headers2 = [
      "Name",
      "Year",
      "College",
      "Degree Program",
      "Contact",
      "GWA",
      "Equiv",
      "Parents' Household Income",
      "Total Score",
      "Rank",
    ];
    const title2 = "REPORT";
    generateTable(document2, data2, headers2, title2);

    const headers3 = ["No", "Name of Candidate", "Degree Program", "Rank"];
    const title3 = "REPORT";
    generateTable(document3, data3, headers3, title3);


  // Finalize the PDF documents and add them to the archive
  document1.end();
  archive.append(document1, { name: "file1.pdf" });

  document2.end();
  archive.append(document2, { name: "file2.pdf" });

  document3.end();
  archive.append(document3, { name: "file3.pdf" });

  // Wrap archive.finalize() in a Promise
  const finalizePromise = new Promise((resolve, reject) => {
    archive.finalize();
    archive.on("finish", resolve);
    archive.on("error", reject);
  });

  try {
    // Wait for the archive to finish writing before sending the response
    await finalizePromise;
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate PDF files." });
  }
});

// router.get("/generate-csv", async (req, res) => {
//   const document1 = [];
//   const document2 = [];
//   const document3 = [];

//   for (const data of csvData) {
//     document1.push({
//       "Name of Candidate": `${data.firstName} ${data.middleName} ${data.lastName}`,
//       "Degree Program": data.course,
//       Rank: data.rank,
//       Remarks: data.approvalStatus,
//     });
//   }

//   for (const data of csvData) {
//     document2.push({
//       Name: `${data.firstName} ${data.middleName} ${data.lastName}`,
//       Year: data.year,
//       College: data.college,
//       "Degree Program": data.course,
//       Contact: data.mobileNum,
//       GWA: data.currentGwa,
//       Equiv: data.EquivGWA,
//       "Parents' Household Income": data.householdIncome,
//       Equiv: data.EquivInc,
//       "Total Score": data.totalScore,
//       Rank: data.rank,
//     });
//   }

//   csvData.map((data, index) => {
//     document3.push({
//       No: index + 1,
//       "Name of Candidate": `${data.firstName} ${data.middleName} ${data.lastName}`,
//       "Degree Program": data.course,
//       Rank: data.rank,
//     });
//   });

//   const opts = {};
//   const transformOpts = {};
//   const asyncOpts = {};
//   const parser = new AsyncParser(opts, transformOpts, asyncOpts);

//   const csv1 = await parser.parse(document1).promise();
//   const csv2 = await parser.parse(document2).promise();
//   const csv3 = await parser.parse(document3).promise();

//   const archive = archiver("zip", {
//     zlib: { level: 9 }, // Sets the compression level.
//   });

//   // Append the CSV files to the archive.
//   archive.append(csv1, { name: "file1.csv" });
//   archive.append(csv2, { name: "file2.csv" });
//   archive.append(csv3, { name: "file3.csv" });

//   // Wrap archive.finalize() in a Promise
//   const finalizePromise = new Promise((resolve, reject) => {
//     archive.finalize();
//     archive.on("finish", resolve);
//     archive.on("error", reject);
//   });

//   // Set the content type header to indicate that the response will contain a zip file
//   res.setHeader("Content-Type", "application/zip");

//   // Set the content disposition header to indicate that the response should be treated as an attachment
//   res.setHeader("Content-Disposition", "attachment; filename=output.zip");

//   // Pipe the compressed archive to the response object
//   archive.pipe(res);

//   try {
//     // Wait for the archive to finish writing before sending the response
//     await finalizePromise;
//     res.end();
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to generate CSV files." });
//   }
// });

// Default

router.get("/*", async (req, res) => {
  //LIFO (Last In First Out)
  const initialOption = await provider.findOne().sort({ _id: -1 }).exec();

  let options = {};

  if (initialOption) {
    options = {
      approvalStatus: "APPROVED",
      provider: initialOption.providerName,
      providerOpeningDate:
        initialOption.openingDates[initialOption.openingDates.length - 1].date,
    };
  } else {
    options = {
      approvalStatus: "APPROVED",
      scholarshipProvider: req.params.provider,
      providerOpeningDate: req.params.openingDate,
    };
  }

  //Get provider names and provider opening dates
  const providerNamesAndOpenings = await provider.find().exec();

  //   if (req.query.provider) options.scholarshipProvider = req.query.provider;

  const page = req.query.page || 1;
  const limit = req.query.limit || 10;

  try {
    // execute query with page and limit values
    const applicants = await applicantsInfo
      .find(options)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const selectedFields = {
      _id: 0,
      _v: 0,
      files: 0,
    };

    csvData = await applicantsInfo.find(options).select(selectedFields).exec();

    const csvData1Object = csvData.map((doc) => doc.toObject());
    csvData = csvData1Object;

    // get total documents in the Posts collection
    const count = await applicantsInfo.countDocuments(options);

    // return response with posts, total pages, and current page
    res.status(200).json({
      applicants,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      limit,
      totalCount: count,
      providerNamesAndOpenings,
    });
  } catch (e) {
    res.status(500).json(e.message);
  }
});

module.exports = router;
