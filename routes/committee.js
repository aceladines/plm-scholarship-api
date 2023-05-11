const express = require("express");
const router = express.Router();
applicantsInfo = require("../models/application");
openings = require("../models/opening");
superUsers = require("../models/superuser");

let options = {};

router.post("/send", async (req, res) => {
  const email = req.body.email;
  const dateSigned = new Date().toISOString();

  try {
    if (Object.keys(options).length === 0 && options.constructor === Object) {
      return res.status(400).json({ message: "Options are empty!" });
    }

    let remarks = {
      email,
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

  let committees = [];

  // * Get all the commitee members
  const committeeMembers = await superUsers.find({ role: "committee" }).exec();

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

  const allSigned =
    committees.length > 0 ? committees.every((committee) => committee.remarks === "Signed") : false;

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
    applicants = await applicantsInfo
      .find(query)
      .sort({ rank: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

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

    // Get wordLink
    let wordLink = await openings.findOne(
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

    wordLink = wordLink?.openingDates[0].wordLink ?? "";

    // return response with posts, total pages, and current page
    res.status(200).json({
      applicants,
      totalPages,
      currentPage: page,
      limit,
      totalCount: count,
      wordLink,
      allSigned,
      committees,
      providerNamesAndOpenings,
    });
  } catch (e) {
    res.status(500).json(e.message);
  }
});

module.exports = router;
