const express = require("express");
const router = express.Router();
applicantsInfo = require("../models/application");
openings = require("../models/opening");

let options = {};

router.post("/send", async (req, res) => {
  const email = req.body.email;
  const name = req.body.name;
  const dateSigned = new Date().toISOString();

  options = {
    provider: options.provider,
    providerOpeningDate: options.providerOpeningDate,
  };

  try {
    if (Object.keys(options).length === 0 && options.constructor === Object) {
      res.status(400).json({ message: "Options are empty!" });
      return;
    }

    let remarks = {
      email,
      name,
      dateSigned,
      status: "Signed",
    };

    const getProviderAndOpening = await openings.findOne(
      {
        $and: [{ providerName: options.provider }, { "openingDates.date": options.providerOpeningDate }],
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

    if (getProviderAndOpening) {
      const remarkExist = getProviderAndOpening.openingDates[0].remarks.some(
        (remark) => remark.email === email
      );

      if (!remarkExist) {
        // If the remark doesn't exist, append it to the array
        await openings.findOneAndUpdate(
          {
            providerName: options.provider,
            "openingDates.date": options.providerOpeningDate,
          },
          { $push: { "openingDates.$.remarks": remarks } },
          { new: true }
        );
        res.status(200).json({ message: "Status sent!" });
      } else {
        res.status(400).json({ message: "You have already sent the status!" });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Default
router.get("/*", async (req, res) => {
  //LIFO (Last In First Out)
  const initialOption = await openings.findOne().sort({ _id: -1 }).exec();

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

  //Get provider names and provider opening dates
  const providerNamesAndOpenings = await openings.find().exec();

  const page = req.query.page || 1;
  const limit = req.query.limit || 10;

  try {
    // Construct query object based on options
    const query = {
      $and: [{ scholarshipProvider: options.provider }, { providerOpeningDate: options.providerOpeningDate }],
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
      $and: [{ providerOpeningDate: options.providerOpeningDate }, { scholarshipProvider: options.provider }],
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
