const express = require("express");
const router = express.Router();
applicantsInfo = require("../models/application");

// Get one applicant by email or studentNumber
router.get("/:id", async (req, res) => {
  try {
    const searchParam = req.params.id;

    const applicant = await applicantsInfo.findOne({
      $or: [{ email: searchParam }, { studentNum: searchParam }],
    });

    if (!applicant) {
      throw new Error("Applicant does not exist!");
    }

    res.status(200).json({ applicant });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// * Reset status of applicants
router.patch("/reset", async (req, res) => {
  const statusToReset = req.body.statusToReset;

  try {
    if (statusToReset === "Approved") {
      await applicantsInfo.updateMany(
        {
          approvalStatus: "APPROVED",
          scholarshipProvider: { $exist: false },
          providerOpeningDate: { $exists: false },
        },
        { $unset: { EquivGWA: "", EquivInc: "", rank: "" }, $set: { approvalStatus: "RESUBMISSION" } }
      );
    } else if (statusToReset === "Disapproved") {
      await applicantsInfo.updateMany(
        {
          approvalStatus: "DISAPPROVED",
        },
        { $unset: { EquivGWA: "", EquivInc: "", rank: "" }, $set: { approvalStatus: "RESUBMISSION" } }
      );
    } else {
      await applicantsInfo.updateMany(
        { approvalStatus: "RESUBMISSION" },
        { $unset: { EquivGWA: "", EquivInc: "", rank: "" }, $set: { approvalStatus: "RESUBMISSION" } }
      );
    }
    res.status(200).json({ message: "Reset successful!" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get all applicants
router.get("/*", async (req, res) => {
  //   let options = {};

  //   if (req.query.yearlvl && req.query.course) {
  //     options.year = req.query.yearlvl;
  //     options.course = req.query.course;
  //   }

  //   if (req.query.yearlvl) options.year = req.query.yearlvl;
  //   if (req.query.degree) options.course = req.query.degree;

  const options = {
    ...(req.query.yearlvl && { year: req.query.yearlvl }),
    ...(req.query.course || (req.query.degree && { course: req.query.course || req.query.degree })),
  };

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
    const count = await applicantsInfo.countDocuments();

    // Calculate total pages
    const totalPages = Math.ceil(count / limit) || 1;

    // return response with posts, total pages, and current page
    res.status(200).json({
      applicants,
      totalPages,
      currentPage: page,
      limit,
      totalCount: count,
    });
  } catch (e) {
    res.status(500).json(e.message);
  }
});

module.exports = router;
