const express = require("express");
const router = express.Router();
applicantsInfo = require("../../models/application");
 
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
