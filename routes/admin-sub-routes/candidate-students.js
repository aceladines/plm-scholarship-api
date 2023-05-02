const express = require("express");
const { AsyncParser } = require("@json2csv/node");
const archiver = require("archiver");
const PDFDocument = require("pdfkit-table");
const router = express.Router();
const applicantsInfo = require("../../models/application");
const openings = require("../../models/opening");
const scholarships = require("../../models/scholarship");
const mail = require("../../utils/mailer");
const superUsers = require("../../models/superuser");

let csvData = [];
let options = {};

router.post("/send-to-committee", async (req, res) => {
  const { wordLink, webLink } = req.body;

  if (Object.keys(options).length === 0 && options.constructor === Object)
    return res.status(400).json({ message: "No options selected!" });

  try {
    // Find the matching openingDates element and update the wordLink property
    const updatedOpening = await openings.findOneAndUpdate(
      {
        providerName: options.provider,
        "openingDates.date": options.providerOpeningDate,
      },
      {
        $set: {
          "openingDates.$.wordLink": wordLink,
        },
      },
      {
        projection: {
          providerName: 1,
          openingDates: {
            $elemMatch: {
              date: options.providerOpeningDate,
            },
          },
        },
        new: true,
      }
    );

    if (!updatedOpening) {
      return res.status(404).json({ message: "No matching document found." });
    }

    const committees = (await superUsers.find({ role: "committee" })).map((user) => {
      return { email: user.email, firstName: user.firstName };
    });

    for (const x of committees) {
      let sendMail = {
        TO: x.email,
        firstName: x.firstName,
        provider: options.provider,
        providerOpeningDate: options.providerOpeningDate,
        option: 4,
        webLink,
      };

      await mail.sendEmail(sendMail);
    }

    res.status(200).json({ message: "Word link successfully updated!" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update word link." });
  }
});

router.post("/approve", async (req, res) => {
  const { email, date } = req.body;
  const dateToPush = date;

  try {
    // Find the applicant document
    const applicant = await applicantsInfo.findOne({ email });
    const scholarshipProvider = applicant.scholarshipProvider;
    const providerOpeningDate = applicant.providerOpeningDate;

    const applicants = await applicantsInfo.find({
      approvalStatus: "APPROVED",
      scholarshipProvider: { $exists: true },
      providerOpeningDate: { $exists: true },
    });

    const providerExist = applicants.some((applicant) => {
      return applicant.scholarshipProvider === scholarshipProvider;
    });

    // * If provider exists, check how many applicants have the same scholarshipProvider
    if (providerExist) {
      const applicantsWithSameProvider = applicants.filter((applicant) => {
        return applicant.scholarshipProvider === scholarshipProvider;
      });

      // * Get the number of unique opening dates
      const uniqueOpeningDates = applicantsWithSameProvider.reduce((acc, curr) => {
        if (!acc.includes(curr.providerOpeningDate)) {
          acc.push(curr.providerOpeningDate);
        }
        return acc;
      }, []);

      // * If the number of unique opening dates is 1, and the number of applicants with the same provider and opening date is 1, delete the provider document

      if (applicantsWithSameProvider) {
        const applicantsWithSameProviderAndOpeningDate = applicantsWithSameProvider.filter((applicant) => {
          return applicant.providerOpeningDate.toISOString() === providerOpeningDate.toISOString();
        });

        if (applicantsWithSameProviderAndOpeningDate) {
          if (applicantsWithSameProviderAndOpeningDate.length === 1 && uniqueOpeningDates.length === 1) {
            await openings.findOneAndDelete({
              providerName: scholarshipProvider,
            });
          }
          if (applicantsWithSameProviderAndOpeningDate.length === 1 && uniqueOpeningDates.length > 1) {
            // * If the number of unique opening dates is more than 1, and the number of applicants with the same provider and opening date is 1, delete the opening date document
            await openings.findOneAndUpdate(
              { providerName: scholarshipProvider },
              {
                $pull: {
                  openingDates: {
                    date: providerOpeningDate.toISOString().substr(0, 10),
                  },
                },
              },
              { new: true }
            );
          }
          await applicantsInfo.findOneAndUpdate(
            { email },
            {
              dateOfBecomingScholar: date,
              approvalStatus: "SCHOLAR",
            },
            { new: true }
          );
        }
      }
    }

    const existingScholarship = await scholarships.findOne({
      providerName: scholarshipProvider,
    });

    if (existingScholarship) {
      // If the provider exists, check if the date already exists in the array
      const dateGivenExists = existingScholarship.dateGiven.some(
        (dateGiven) => dateGiven.date === dateToPush
      );

      if (!dateGivenExists) {
        // If the date doesn't exist, append it to the array
        existingScholarship.dateGiven.push({
          date: dateToPush,
        });
        await existingScholarship.save();
      }
    } else {
      // * If the provider doesn't exist, create a new provider document with the date
      const newProvider = new scholarships({
        providerName: scholarshipProvider,
        dateGiven: [{ date: dateToPush }],
      });
      await newProvider.save();
    }

    let sendMail = {
      TO: email,
      date,
      provider: scholarshipProvider,
      option: 3,
    };

    await mail.sendEmail(sendMail);

    res.status(200).json({ message: "Applicant became a scholar!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/reject", async (req, res) => {
  try {
    const email = req.body.email;
    // Find the applicant document
    const applicant = await applicantsInfo.findOne({ email });
    const scholarshipProvider = applicant.scholarshipProvider;
    const providerOpeningDate = applicant.providerOpeningDate;

    // * Get all the applicants that have scholarshipProvider and providerOpeningDate fields
    const applicants = await applicantsInfo.find({
      approvalStatus: "APPROVED",
      scholarshipProvider: { $exists: true },
      providerOpeningDate: { $exists: true },
    });

    const providerExist = applicants.some((applicant) => {
      return applicant.scholarshipProvider === scholarshipProvider;
    });

    // * If provider exists, check how many applicants have the same scholarshipProvider
    if (providerOpeningDate && scholarshipProvider && providerExist) {
      const applicantsWithSameProvider = applicants.filter((applicant) => {
        return applicant.scholarshipProvider === scholarshipProvider;
      });
      // * Get the number of unique opening dates
      const uniqueOpeningDates = applicantsWithSameProvider.reduce((acc, curr) => {
        if (!acc.includes(curr.providerOpeningDate)) {
          acc.push(curr.providerOpeningDate);
        }
        return acc;
      }, []);

      // * If the number of unique opening dates is 1, and the number of applicants with the same provider and opening date is 1, delete the provider document

      if (applicantsWithSameProvider) {
        const applicantsWithSameProviderAndOpeningDate = applicantsWithSameProvider.filter((applicant) => {
          return applicant.providerOpeningDate.toISOString() === providerOpeningDate.toISOString();
        });

        if (applicantsWithSameProviderAndOpeningDate) {
          if (applicantsWithSameProviderAndOpeningDate.length === 1 && uniqueOpeningDates.length === 1) {
            await openings.findOneAndDelete({
              providerName: scholarshipProvider,
            });
          }
          if (applicantsWithSameProviderAndOpeningDate.length === 1 && uniqueOpeningDates.length > 1) {
            // * If the number of unique opening dates is more than 1, and the number of applicants with the same provider and opening date is 1, delete the opening date document
            await openings.findOneAndUpdate(
              { providerName: scholarshipProvider },
              {
                $pull: {
                  openingDates: {
                    date: providerOpeningDate.toISOString().substr(0, 10),
                  },
                },
              },
              { new: true }
            );
          }
          // Remove certain fields from the applicant's document
          await applicantsInfo.findOneAndUpdate(
            { email },
            { $unset: { providerOpeningDate: "", scholarshipProvider: "" } },
            { new: true }
          );
        }
        res.status(200).json({ message: "Applicant rejected." });
      }
    } else {
      res.status(404).json({ message: "No matching document found." });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/generate-pdf", async (req, res) => {
  if (csvData.length === 0) {
    res.status(500).json({ error: "No data to generate" });
    return;
  }

  let data1 = [];
  let data2 = [];
  let data3 = [];

  for (const data of csvData) {
    data1.push({
      "Name of Candidate": `${data.lastName}, ${data.firstName} ${data.middleName}`,
      "Degree Program": data.course,
      Rank: data.rank,
      Remarks: data.approvalStatus,
    });
  }

  for (const data of csvData) {
    data2.push({
      Name: `${data.lastName}, ${data.firstName} ${data.middleName}`,
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
      "Name of Candidate": `${data.lastName}, ${data.firstName} ${data.middleName}`,
      "Degree Program": data.course,
      Rank: data.rank,
    });
  });

  const document1 = new PDFDocument({
    layout: "landscape", // Set the layout to landscape
    size: "letter", // Set the page size to letter (or any other size you prefer)
  });
  const document2 = new PDFDocument({
    layout: "landscape", // Set the layout to landscape
    size: "letter", // Set the page size to letter (or any other size you prefer)
  });
  const document3 = new PDFDocument({
    layout: "landscape", // Set the layout to landscape
    size: "letter", // Set the page size to letter (or any other size you prefer)
  });

  const archive = archiver("zip", {
    zlib: { level: 9 }, // Sets the compression level.
  });

  // Set the content type header to indicate that the response will contain a zip file
  res.setHeader("Content-Type", "application/zip");

  // Set the content disposition header to indicate that the response should be treated as an attachment
  res.setHeader("Content-Disposition", "attachment; filename=report-pdf.zip");

  // Pipe the compressed archive to the response object
  archive.pipe(res);

  // Function to generate table in PDF document
  const generateTable = (header, data, document, flag) => {
    const table = {
      headers: [...header],
      datas: [...data],
      rows: [],
    };

    document.text("REPORT", { align: "center" });
    document.moveDown(2);

    let xVal = 0;

    if (flag === 1) xVal = 250;
    if (flag === 3) xVal = 270;

    document.table(table, {
      prepareHeader: () => document.font("Helvetica-Bold").fontSize(10),
      prepareRow: (row, indexColumn, indexRow, rectRow) => document.font("Helvetica").fontSize(8),
      padding: 4,
      x: xVal,
      // addPage: true,
    });
  };

  const headers1 = [
    {
      label: "Name of Candidate",
      property: "Name of Candidate",
      width: 120,
      renderer: null,
    },
    {
      label: "Degree Program",
      property: "Degree Program",
      width: 90,
      renderer: null,
    },
    { label: "Rank", property: "Rank", width: 35, renderer: null },
    { label: "Remarks", property: "Remarks", width: 53, renderer: null },
  ];
  const title1 = "REPORT";
  generateTable(headers1, data1, document1, 1);

  const headers2 = [
    { label: "Name", property: "Name", width: 120, renderer: null },
    { label: "Year", property: "Year", width: 35, renderer: null },
    { label: "College", property: "College", width: 50, renderer: null },
    {
      label: "Degree Program",
      property: "Degree Program",
      width: 90,
      renderer: null,
    },
    { label: "Contact", property: "Contact", width: 70, renderer: null },
    { label: "GWA", property: "GWA", width: 35, renderer: null },
    { label: "Equiv", property: "Equiv", width: 37, rendere: null },
    {
      label: "Parents' Household Income",
      property: "Parents' Household Income",
      width: 120,
      renderer: null,
    },
    {
      label: "Total Score",
      property: "Total Score",
      width: 45,
      renderer: null,
    },
    { label: "Rank", property: "Rank", width: 35, renderer: null },
  ];
  const title2 = "REPORT";
  generateTable(headers2, data2, document2, 2);

  const headers3 = [
    { label: "No", property: "No", width: 25, renderer: null },
    {
      label: "Name of Candidate",
      property: "Name of Candidate",
      width: 120,
      renderer: null,
    },
    {
      label: "Degree Program",
      property: "Degree Program",
      width: 90,
      renderer: null,
    },
    { label: "Rank", property: "Rank", width: 35, renderer: null },
  ];
  const title3 = "REPORT";
  generateTable(headers3, data3, document3, 3);

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

router.get("/generate-csv", async (req, res) => {
  if (csvData.length === 0) {
    res.status(500).json({ error: "No data to generate" });
    return;
  }

  const document1 = [];
  const document2 = [];
  const document3 = [];

  for (const data of csvData) {
    document1.push({
      "Name of Candidate": `${data.lastName}, ${data.firstName} ${data.middleName}`,
      "Degree Program": data.course,
      Rank: data.rank,
      Remarks: data.approvalStatus,
    });
  }

  for (const data of csvData) {
    document2.push({
      Name: `${data.lastName}, ${data.firstName} ${data.middleName}`,
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
    document3.push({
      No: index + 1,
      "Name of Candidate": `${data.lastName}, ${data.firstName} ${data.middleName}`,
      "Degree Program": data.course,
      Rank: data.rank,
    });
  });

  const opts = {};
  const transformOpts = {};
  const asyncOpts = {};
  const parser = new AsyncParser(opts, transformOpts, asyncOpts);

  const csv1 = await parser.parse(document1).promise();
  const csv2 = await parser.parse(document2).promise();
  const csv3 = await parser.parse(document3).promise();

  const archive = archiver("zip", {
    zlib: { level: 9 }, // Sets the compression level.
  });

  // Append the CSV files to the archive.
  archive.append(csv1, { name: "file1.csv" });
  archive.append(csv2, { name: "file2.csv" });
  archive.append(csv3, { name: "file3.csv" });

  // Wrap archive.finalize() in a Promise
  const finalizePromise = new Promise((resolve, reject) => {
    archive.finalize();
    archive.on("finish", resolve);
    archive.on("error", reject);
  });

  // Set the content type header to indicate that the response will contain a zip file
  res.setHeader("Content-Type", "application/zip");

  // Set the content disposition header to indicate that the response should be treated as an attachment
  res.setHeader("Content-Disposition", "attachment; filename=report-csv.zip");

  // Pipe the compressed archive to the response object
  archive.pipe(res);

  try {
    // Wait for the archive to finish writing before sending the response
    await finalizePromise;
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate CSV files." });
  }
});

// Default
router.get("/*", async (req, res) => {
  //LIFO (Last In First Out)
  const initialOption = await openings.findOne().sort({ _id: -1 }).exec();

  let committees = [];

  // * Get all the commitee members
  const committeeMembers = await superUsers.find({ role: "committee" }).exec();

  options = {};

  if (initialOption && (req.query.provider === undefined || req.query.openingDate === undefined)) {
    options = {
      provider: initialOption.providerName,
      providerOpeningDate: initialOption.openingDates[initialOption.openingDates.length - 1].date,
    };
  } else {
    options = {
      provider: req.query.provider,
      providerOpeningDate: req.query.openingDate,
    };
  }

  // * Check if the current committee member have remarks on the current opening
  const currentProviderAndOpening = await openings.find(
    {
      providerName: options.provider,
      "openingDates.date": options.providerOpeningDate,
    },
    (projection = {
      providerName: 1,
      openingDates: {
        $elemMatch: {
          date: options.providerOpeningDate,
        },
      },
    })
  );

  for (committeeMember of committeeMembers) {
    if (currentProviderAndOpening[0]?.openingDates[0]) {
      const remarks = currentProviderAndOpening[0].openingDates[0].remarks;
      const committeeMemberRemarks = remarks.filter((remark) => remark.email === committeeMember.email);

      committees.push({
        name: `${committeeMember.firstName} ${committeeMember.lastName}`,
        remarks: committeeMemberRemarks[0]?.status ?? "Not signed",
        dateSigned: committeeMemberRemarks[0]?.dateSigned ?? "",
      });
    }
  }

  const allSigned = committees.every((committee) => committee.remarks === "Signed");

  if (allSigned) {
    await openings.findOneAndUpdate(
      {
        providerName: options.provider,
        "openingDates.date": options.providerOpeningDate,
      },
      {
        $set: {
          "openingDates.$.allSigned": true,
        },
      }
    );
  }

  //Get provider names and provider opening dates
  const providerNamesAndOpenings = await openings.aggregate([
    // Unwind the openingDates array
    { $unwind: "$openingDates" },

    // Sort by date in ascending order
    { $sort: { "openingDates.date": -1 } },

    // Group by scholarship provider and reconstruct the openingDates array
    {
      $group: {
        _id: "$_id",
        providerName: { $first: "$providerName" },
        openingDates: { $push: "$openingDates" },
      },
    },
  ]);

  // * If the length of remark array is 4, then the list of applicants is evaluated. The allSigned value will be set to true.

  const page = req.query.page || 1;
  const limit = req.query.limit || 10;

  try {
    // Construct query object based on options
    const query = {
      $and: [
        {
          approvalStatus: "APPROVED",
        },
        { scholarshipProvider: { $exists: true } },
        { providerOpeningDate: { $exists: true } },
        { scholarshipProvider: options.provider },
        { providerOpeningDate: options.providerOpeningDate },
      ],
    };
    // execute query with page and limit values
    const applicants = await applicantsInfo
      .find(query)
      .sort({ rank: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const selectedFields = {
      _id: 0,
      _v: 0,
      files: 0,
    };

    csvData = await applicantsInfo.find(query).sort({ rank: 1 }).select(selectedFields).exec();

    const csvDataToObject = csvData.map((doc) => doc.toObject());
    csvData = csvDataToObject;

    // get total documents in the Posts collection
    const count = await applicantsInfo.countDocuments({
      $and: [
        { approvalStatus: "APPROVED" },
        { scholarshipProvider: { $exists: true } },
        { providerOpeningDate: { $exists: true } },
        { providerOpeningDate: options.providerOpeningDate },
        { scholarshipProvider: options.provider },
      ],
    });

    // Calculate total pages
    const totalPages = Math.ceil(count / limit) || 1;

    // return response with posts, total pages, and current page
    res.status(200).json({
      applicants,
      totalPages,
      currentPage: page,
      limit,
      totalCount: count,
      allSigned,
      committees,
      providerNamesAndOpenings,
    });
  } catch (e) {
    res.status(500).json(e.message);
  }
});

module.exports = router;
