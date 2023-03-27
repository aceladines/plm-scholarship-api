const express = require("express");
const { AsyncParser } = require("@json2csv/node");
const archiver = require("archiver");
const { promisify } = require("util");
const path = require("path");
const fs = require("fs");
const router = express.Router();
applicantsInfo = require("../../models/application");
provider = require("../../models/provider");

router.get("/generate-csv", async (req, res) => {
  // Dummy data

  const documents1 = [
    {
      No: 1,
      "Name of Candidate": "John Doe",
      "Degree Program": "BSIT",
      Rank: 1,
      Remarks: "Approved",
    },
    {
      No: 2,
      "Name of Candidate": "Jane Doe",
      "Degree Program": "BSIT",
      Rank: 2,
      Remarks: "Approved",
    },
    {
      No: 3,
      "Name of Candidate": "John Ilacad",
      "Degree Program": "BSIT",
      Rank: 3,
      Remarks: "Approved",
    },
    {
      No: 4,
      "Name of Candidate": "Ace Ladines",
      "Degree Program": "BSIT",
      Rank: 4,
      Remarks: "Approved",
    },
  ];

  const documents2 = [
    {
      Name: "Jane Doe",
      Year: "1st",
      College: "CET",
      "Degree Program": "BSIT",
      Contact: "09123456789",
      GWA: 1,
      Equiv: 1,
      "Parents' Household Income": 100000,
      Equiv: 1,
      "Total Score": 6.5,
      Rank: 1,
    },
    {
      Name: "Jane Doe",
      Year: "1st",
      College: "CET",
      "Degree Program": "BSIT",
      Contact: "09123456789",
      GWA: 1,
      Equiv: 1,
      "Parents' Household Income": 100000,
      Equiv: 1,
      "Total Score": 6.5,
      Rank: 1,
    },
    {
      Name: "Jane Doe",
      Year: "1st",
      College: "CET",
      "Degree Program": "BSIT",
      Contact: "09123456789",
      GWA: 1,
      Equiv: 1,
      "Parents' Household Income": 100000,
      Equiv: 1,
      "Total Score": 6.5,
      Rank: 1,
    },
  ];

  const documents3 = [
    {
      No: 1,
      "Name of Candidate": "John Doe",
      "Degree Program": "BSIT",
      Rank: 1,
    },
    {
      No: 2,
      "Name of Candidate": "Jane Doe",
      "Degree Program": "BSIT",
      Rank: 2,
    },
    {
      No: 3,
      "Name of Candidate": "John Ilacad",
      "Degree Program": "BSIT",
      Rank: 3,
    },
    {
      No: 4,
      "Name of Candidate": "Ace Ladines",
      "Degree Program": "BSIT",
      Rank: 4,
    },
  ];

  const opts = {};
  const transformOpts = {};
  const asyncOpts = {};
  const parser = new AsyncParser(opts, transformOpts, asyncOpts);

  const csv1 = await parser.parse(documents1).promise();
  const csv2 = await parser.parse(documents2).promise();
  const csv3 = await parser.parse(documents3).promise();

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

router.get("/");

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
