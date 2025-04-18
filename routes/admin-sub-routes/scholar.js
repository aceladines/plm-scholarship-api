const express = require("express");
const router = express.Router();
const applicantsInfo = require("../../models/application");
const scholarships = require("../../models/scholarship");
const archives = require("../../models/archive");

let options = {};

router.get("/search", async (req, res) => {
  const searchParam = req.query.searchParam;
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;

  try {
    const query = {
      $and: [
        { approvalStatus: "SCHOLAR" },
        {
          $or: [
            { firstName: { $regex: searchParam, $options: "i" } },
            { lastName: { $regex: searchParam, $options: "i" } },
            { course: { $regex: searchParam, $options: "i" } },
            { studentNum: { $regex: searchParam, $options: "i" } },
            { approvalStatus: { $regex: searchParam, $options: "i" } },
          ],
        },
      ],
    };

    // * Get provider names and dateGiven
    const providerNamesAndDateGiven = await scholarships.aggregate([
      // Unwind the openingDates array
      { $unwind: "$dateGiven" },

      // Sort by date in ascending order
      { $sort: { "dateGiven.date": -1 } },

      // Group by scholarship provider and reconstruct the openingDates array
      {
        $group: {
          _id: "$_id",
          providerName: { $first: "$providerName" },
          dateGiven: { $push: "$dateGiven" },
        },
      },
    ]);

    // * Get total documents in the collection
    const count = await applicantsInfo.countDocuments(query);

    // * Calculate total pages
    const totalPages = Math.ceil(count / limit) || 1;

    const applicants = await applicantsInfo
      .find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    if (!applicants) {
      res.status(200).json({
        applicants,
        totalPages,
        currentPage: page,
        limit,
        totalCount: count,
        providerNamesAndDateGiven,
      });
    }

    res.status(200).json({
      applicants,
      totalPages,
      currentPage: page,
      limit,
      totalCount: count,
      providerNamesAndDateGiven,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// * Delete one record
router.post("/archive-data/:email", async (req, res) => {
  try {
    const archivedDoc = await applicantsInfo.findOne({ email: req.params.email }).lean().exec();

    const scholarshipProvider = archivedDoc.scholarshipProvider;
    const dateOfBecomingScholar = archivedDoc.dateOfBecomingScholar;

    await archives.insertMany(archivedDoc);

    // * Get all the applicants that have scholarshipProvider and dateGiven fields

    const applicants = await applicantsInfo.find({
      approvalStatus: "SCHOLAR",
      $and: [{ scholarshipProvider }, { dateOfBecomingScholar }],
    });

    // * Count the number of dateGiven index in the current provider

    const scholarship = await scholarships.findOne({ providerName: scholarshipProvider });

    if (applicants.length === 1) {
      if (scholarship.dateGiven.length === 1) {
        await scholarships.findOneAndDelete({ providerName: scholarshipProvider });
      } else {
        await scholarships.findOneAndUpdate(
          { providerName: scholarshipProvider },
          { $pull: { dateGiven: { date: dateOfBecomingScholar.toISOString().substr(0, 10) } } }
        );
      }
    }

    await applicantsInfo.deleteOne({ email: req.params.email });

    res.status(200).json({ message: "Archived successfully!!" });
  } catch (error) {
    res.status(500).json(error.message);
  }
});

// * Delete Records based on options
router.post("/archive-datas", async (req, res) => {
  if (Object.keys(options).length === 0) return res.status(400).json({ message: "No data to archive!!" });

  try {
    // * Create query object based on options
    const query = {
      $and: [
        { approvalStatus: options.approvalStatus },
        { scholarshipProvider: options.scholarshipProvider },
        { dateOfBecomingScholar: options.dateOfBecomingScholar },
      ],
    };

    // Archive documents
    const archivedDocs = await applicantsInfo.find(query).lean().exec();

    await archives.insertMany(archivedDocs);

    // * Count the number of dateGiven index in the current provider

    const scholarship = await scholarships.findOne({ providerName: options.scholarshipProvider });

    if (scholarship.dateGiven.length === 1) {
      await scholarships.findOneAndDelete({ providerName: options.scholarshipProvider });
    } else {
      await scholarships.findOneAndUpdate(
        { providerName: options.scholarshipProvider },
        { $pull: { dateGiven: { date: options.dateOfBecomingScholar.substr(0, 10) } } }
      );
    }

    // Delete documents
    await applicantsInfo.deleteMany(query);

    res.status(200).json({ message: "Archived successfully!!" });
  } catch (error) {
    res.status(500).json(error.message);
  }
});

// * Default
router.get("/*", async (req, res) => {
  // * LIFO (Last In First Out)

  const initialOption = await scholarships.findOne().sort({ _id: -1 }).exec();

  if (initialOption && (req.query.provider === undefined || req.query.dateGiven === undefined)) {
    options = {
      approvalStatus: "SCHOLAR",
      scholarshipProvider: initialOption.providerName,
      dateOfBecomingScholar: initialOption.dateGiven[initialOption.dateGiven.length - 1].date,
    };
  } else {
    options = {
      approvalStatus: "SCHOLAR",
      scholarshipProvider: req.query.provider,
      dateOfBecomingScholar: req.query.dateGiven,
    };
  }

  // * Get provider names and dateGiven
  const providerNamesAndDateGiven = await scholarships.aggregate([
    // Unwind the openingDates array
    { $unwind: "$dateGiven" },

    // Sort by date in ascending order
    { $sort: { "dateGiven.date": -1 } },

    // Group by scholarship provider and reconstruct the openingDates array
    {
      $group: {
        _id: "$_id",
        providerName: { $first: "$providerName" },
        dateGiven: { $push: "$dateGiven" },
      },
    },
  ]);

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
