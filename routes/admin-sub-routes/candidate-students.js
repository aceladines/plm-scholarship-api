const express = require("express");
const { AsyncParser } = require("@json2csv/node");
const archiver = require("archiver");
const { promisify } = require("util");
const path = require("path");
const fs = require("fs");
const router = express.Router();
applicantsInfo = require("../../models/application");
provider = require("../../models/provider");

let csvData;

router.get("/generate-csv", async (req, res) => {
  const document1 = [],
    document2 = [],
    document3 = [];

  for (const data of csvData) {
    document1.push({
      "Name of Candidate": `${data.firstName} ${data.middleName} ${data.lastName}`,
      "Degree Program": data.course,
      Rank: data.rank,
      Remarks: data.approvalStatus,
    });
  }

  for (const data of csvData) {
    document2.push({
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
    document3.push({
      No: index + 1,
      "Name of Candidate": `${data.firstName} ${data.middleName} ${data.lastName}`,
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

  // Finalize the archive.
  archive.finalize();

  // Write the compressed archive to a file named "output.zip"
  const outputFilePath = path.join(__dirname, "output.zip");
  const output = fs.createWriteStream(outputFilePath);
  archive.pipe(output);

  // Listen for the archive to finish writing to the file.
  output.on("close", () => {
    // Send a response to the client indicating that the file has been written.
    res.send(`The compressed archive has been written to ${outputFilePath}`);
  });

  // Log a message to indicate that the file has been written.
  console.log(`The compressed archive is being written to ${outputFilePath}`);
});

// Default
router.get("/*", async (req, res) => {
  //LIFO (Last In First Out)
  const initialOption = await provider.findOne().sort({ _id: -1 }).exec();
  console.log(initialOption);

  //Initial options
  let initialOptions = {
    provider: initialOption.providerAndDates[0].providerName,
    providerOpeningDate:
      initialOption.providerAndDates[0].providerOpeningDate[
        initialOption.providerAndDates[0].providerOpeningDate.length - 1
      ].date,
  };

  console.log("Initial Option: ");
  console.log(initialOptions);

  // Dummy options
  let options = {
    approvalStatus: "APPROVED",
    scholarshipProvider: null ?? initialOptions.provider,
    providerOpeningDate: null ?? initialOptions.providerOpeningDate,
  };

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
