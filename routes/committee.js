const express = require("express");
const router = express.Router();
applicantsInfo = require("../models/application");
openings = require("../models/opening");

let options;

router.post("/send", async (req, res) => {
  const name = req.body.name;

  try {
    let remarks = {
      name,
      dateSigned: new Date().toISOString,
      status: "Signed",
    };

    await openings.findOneAndUpdate(
      {
        providerName: options.provider,
        "openingDates.date": options.providerOpeningDate,
      },
      { $push: { "openingDates.$.remarks": remarks } },
      { new: true }
    );

    res.status(200).json({ message: "Status sent!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Default
router.get("/*", async (req, res) => {
  //LIFO (Last In First Out)
  const initialOption = await openings.findOne().sort({ _id: -1 }).exec();
  options = {};

  if (
    initialOption &&
    (req.query.provider === undefined || req.query.openingDate === undefined)
  ) {
    options = {
      provider: initialOption.providerName,
      providerOpeningDate:
        initialOption.openingDates[initialOption.openingDates.length - 1].date,
    };
  } else {
    options = {
      provider: req.query.provider,
      providerOpeningDate: req.query.openingDate,
    };
  }

  //Get provider names and provider opening dates
  const providerNamesAndOpenings = await openings.find().exec();

  //   if (req.query.provider) options.scholarshipProvider = req.query.provider;

  const page = req.query.page || 1;
  const limit = req.query.limit || 10;

  try {
    // Construct query object based on options
    const query = {
      $and: [
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

    // get total documents in the Posts collection
    const count = await applicantsInfo.countDocuments({
      $and: [
        { providerOpeningDate: options.providerOpeningDate },
        { scholarshipProvider: options.provider },
      ],
    });

    // Calculate total pages
    const totalPages = Math.ceil(count / limit) || 1;

    // Get wordLink
    let wordLink = await openings.findOne({
      providerName: options.provider,
      "openingDates.date": options.providerOpeningDate,
    });

    wordLink = wordLink.openingDates[0].wordLink ?? "";

    // return response with posts, total pages, and current page
    res.status(200).json({
      applicants,
      wordLink,
      totalPages,
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
