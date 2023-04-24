const express = require("express");
const router = express.Router();
applicantsInfo = require("../../models/application");
const mail = require("../../utils/mailer");

router.get("/search", async (req, res) => {
  const searchParam = req.query.searchParam;
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;

  try {
    const query = {
      $and: [
        {
          $or: [{ approvalStatus: "PENDING" }, { approvalStatus: "RESUBMISSION" }],
        },
        {
          $or: [
            { firstName: { $regex: searchParam, $options: "i" } },
            { lastName: { $regex: searchParam, $options: "i" } },
            { approvalStatus: { $regex: searchParam, $options: "i" } },
            { studentNum: { $regex: searchParam, $options: "i" } },
          ],
        },
      ],
    };

    const applicants = await applicantsInfo
      .find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // * Get total documents in the collection
    const count = await applicantsInfo.countDocuments(query);

    // * Calculate total pages
    const totalPages = Math.ceil(count / limit) || 1;

    if (!applicants) {
      res.status(200).json({
        applicants,
        totalPages,
        currentPage: page,
        limit,
        totalCount: count,
      });
    }

    res.status(200).json({
      applicants,
      totalPages,
      currentPage: page,
      limit,
      totalCount: count,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/approve", async (req, res) => {
  const email = req.body.email;
  const message = req.body.message;

  let gwaEquiv = 0;
  let incEquiv = 0;
  let totalScore = 0;

  const gwaEquivArray = [
    { range: [1, 1.24], value: 7 },
    { range: [1.25, 1.49], value: 6 },
    { range: [1.5, 1.74], value: 5 },
    { range: [1.75, 1.99], value: 4 },
    { range: [2, 2.24], value: 3 },
    { range: [2.25, 2.49], value: 2 },
    { range: [2.5, Infinity], value: 1 },
  ];

  const incEquivArray = [
    { range: [0, 69_999], value: 7 },
    { range: [70000, 139_999], value: 6 },
    { range: [140_000, 209_999], value: 5 },
    { range: [210_000, 279_999], value: 4 },
    { range: [280_000, 349_999], value: 3 },
    { range: [350_000, 419_999], value: 2 },
    { range: [420_000, Infinity], value: 1 },
  ];

  function findValue(arr, val) {
    for (let i = 0; i < arr.length; i++) {
      if (val >= arr[i].range[0] && val <= arr[i].range[1]) {
        return arr[i].value / 2;
      }
    }
  }

  const user = await applicantsInfo.findOne({ email });

  if (user) {
    gwaEquiv = findValue(gwaEquivArray, user.currentGwa);
    incEquiv = findValue(incEquivArray, user.householdIncome);
    totalScore = gwaEquiv + incEquiv;

    try {
      await applicantsInfo.findOneAndUpdate(
        { email: user.email },
        {
          approvalStatus: "APPROVED",
          EquivGWA: gwaEquiv,
          EquivInc: incEquiv,
          totalScore,
          dateApproved: new Date().toISOString(),
        },
        async (err) => {
          if (!err) {
            let sendMail = {
              TO: email,
              option: 0,
              message,
            };

            const mailInfo = await mail.sendEmail(sendMail);
            res.status(200).json({ message: "Applicant approved!", mailInfo });
          }
        }
      );
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  } else {
    res.status(404).json({ message: "Applicant does not exists!" });
  }
});

router.post("/disapprove", async (req, res) => {
  const email = req.body.email;
  const message = req.body.message;

  try {
    applicantsInfo.findOneAndUpdate(
      { email },
      { approvalStatus: "DISAPPROVED", dateDisapproved: new Date().toISOString() },
      async (err) => {
        if (!err) {
          let sendMail = {
            TO: email,
            option: 1,
            message,
          };

          const mailInfo = await mail.sendEmail(sendMail);
          res.status(200).json({ message: "Applicant disapproved!", mailInfo });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/resubmit", async (req, res) => {
  const email = req.body.email;
  const message = req.body.message;

  try {
    applicantsInfo.findOneAndUpdate(
      { email },
      { approvalStatus: "RESUBMISSION", dateOfResubmission: new Date().toISOString() },
      async (err) => {
        if (!err) {
          let sendMail = {
            TO: email,
            option: 2,
            message,
          };

          const mailInfo = await mail.sendEmail(sendMail);
          res.status(200).json({ message: "Applicant resubmitted!", mailInfo });
        }
      }
    );
  } catch (error) {}
});

// Get all data whose approvalStatus = (APPROVED, RESUBMISSION)
router.get("/*", async (req, res) => {
  let options = {
    $or: [{ approvalStatus: "PENDING" }, { approvalStatus: "RESUBMISSION" }],
  };

  if (req.query.yearlvl && req.query.course) {
    options.year = req.query.yearlvl;
    options.course = req.query.course;
  }

  if (req.query.yearlvl) options.year = req.query.yearlvl;
  if (req.query.degree) options.course = req.query.degree;

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
    const count = await applicantsInfo.countDocuments({
      $or: [{ approvalStatus: "PENDING" }, { approvalStatus: "RESUBMISSION" }],
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
    });
  } catch (e) {
    res.status(500).json(e.message);
  }
});

module.exports = router;
