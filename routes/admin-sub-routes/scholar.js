const express = require("express");
const router = express.Router();
applicantsInfo = require("../../models/application");

// Default
router.get("/*", async (req, res) => {
  //LIFO (Last In First Out)
  const initialOption = await provider.findOne().sort({ _id: -1 }).exec();

  let options = {};
  if (initialOption) {
    options = {
      approvalStatus: "SCHOLAR",
      provider: initialOption.providerName,
      becomingScholarDates:
        initialOption.becomingScholarDates[
          initialOption.becomingScholarDates.length - 1
        ].date,
    };
  } else {
    options = {
      approvalStatus: "SCHOLAR",
      provider: req.params.provider,
      becomingScholarDates: req.params.openingDate,
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

    // get total documents in the Posts collection
    const count = await applicantsInfo.countDocuments(options);

    // Calculate total pages
    const totalPages = Math.ceil(count / limit) || 1;

    // return response with posts, total pages, and current page
    res.status(200).json({
      applicants,
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
