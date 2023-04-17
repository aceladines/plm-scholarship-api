const express = require("express");
const router = express.Router();
const applicantsInfo = require("../../models/application");
const scholarships = require("../../models/scholarship");

// * Default

router.get("/*", async (req, res) => {
  // * LIFO (Last In First Out)

  const initialOption = await scholarships.findOne().sort({ _id: -1 }).exec();

  let options = {};
  if (initialOption) {
    options = {
      approvalStatus: "SCHOLAR",
      scholarshipProvider: initialOption.providerName,
      dateOfBecomingScholar:
        initialOption.dateGiven[initialOption.dateGiven.length - 1].date,
    };
  } else {
    options = {
      approvalStatus: "SCHOLAR",
      scholarshipProvider: req.params.provider,
      dateOfBecomingScholar: req.params.openingDate,
    };
  }

  // * Get provider names and dateGiven
  const providerNamesAndDateGiven = await scholarships.find().exec();

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
