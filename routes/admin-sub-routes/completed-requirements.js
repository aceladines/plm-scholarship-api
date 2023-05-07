const express = require("express");
const router = express.Router();
const applicantsInfo = require("../../models/application");
const opening = require("../../models/opening");

router.put("/move", async (req, res) => {
  const toMove = req.body;

  try {
    //Update the status of each moved student into 'APPROVED'
    let movedStudents;

    if (Object.keys(toMove).length === 0) {
      res.status(400).json({ message: "No student/s to move!" });
      return;
    }

    for (const student of toMove.studentNumber) {
      movedStudents = await applicantsInfo.findOneAndUpdate(
        {
          $and: [{ studentNum: student }, { approvalStatus: "APPROVED" }],
        },
        {
          scholarshipProvider: toMove.provider,
          providerOpeningDate: toMove.providerOpeningDate,
          approvalStatus: "APPROVED",
        }
      );
    }

    const existingOpening = await opening.findOne({
      providerName: toMove.provider,
    });

    if (existingOpening) {
      // If the opening exists, check if the opening date already exists in the array
      const openingDateExists = existingOpening.openingDates.some(
        (openingDate) => openingDate.date === toMove.providerOpeningDate
      );

      if (!openingDateExists) {
        // If the opening date doesn't exist, append it to the array
        existingOpening.openingDates.push({
          date: toMove.providerOpeningDate,
        });
        await existingOpening.save();
        console.log("New provider opening date added!");
      } else {
        console.log("Provider opening date already exists!");
      }
    } else {
      // If the provider doesn't exist, create a new provider document with the opening date
      const newProvider = new opening({
        providerName: toMove.provider,
        openingDates: [{ date: toMove.providerOpeningDate }],
        scholarsDates: [],
      });
      await newProvider.save();
      console.log("New provider and provider opening date added!");
    }

    res.status(200).json({ message: "Successfully moved student/s!" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/*", async (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  try {
    const options = {};
    if (req.query.yrLvl || req.query.degreeProgram) {
      let yrLvl = [];
      let degreeProgram = [];

      if (req.query.yrLvl) yrLvl = JSON.parse(req.query.yrLvl);
      if (req.query.degreeProgram) degreeProgram = JSON.parse(req.query.degreeProgram);

      options = {
        approvalStatus: "APPROVED",
        providerOpeningDate: { $exists: false },
        scholarshipProvider: { $exists: false },
        $or: [{ year: { $in: yrLvl } }, { course: { $in: degreeProgram } }],
      };
    } else {
      options = {
        approvalStatus: "APPROVED",
        providerOpeningDate: { $exists: false },
        scholarshipProvider: { $exists: false },
      };
    }
    // execute query with page and limit values
    const applicants = await applicantsInfo
      .find(options)
      .sort({ totalScore: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // get total documents in the Posts collection
    const count = await applicantsInfo.countDocuments(options);

    let totalPages = Math.ceil(count / limit);
    if (totalPages === 0) totalPages = 1;

    //Get provider names and provider opening dates
    const providerNamesAndOpenings = await openings.find().exec();

    if (req.query.yrLvl === undefined && req.query.degreeProgram === undefined) {
      if (applicants.length === 0) {
        res.status(200).json({
          applicants,
          totalPages,
          currentPage: page,
          limit,
          totalCount: count,
          providerNamesAndOpenings,
        });
      } else if (applicants.length === 1) {
        await applicantsInfo.findOneAndUpdate({ studentNum: applicants[0].studentNum }, { rank: 1 });

        // return response with posts, total pages, and current page
        res.status(200).json({
          applicants,
          totalPages,
          currentPage: page,
          limit,
          totalCount: count,
          providerNamesAndOpenings,
        });
      } else {
        let sum = 1;
        let indexFlag = 2;
        let rank = 0;
        let rankArr = [];
        let totalScoreArr = [];

        // Push the totalScore into 'totalScoreArr'
        for (let i = 0; i < applicants.length; i++) {
          totalScoreArr.push(applicants[i].totalScore);
        }

        // Making a set from 'totalScoreArr'
        let set = new Set(totalScoreArr);
        let distinctElems = [...set];

        // Counting occurences of 'totalScore' values
        let occurence = totalScoreArr.reduce(function (acc, current) {
          if (acc[current]) {
            acc[current]++;
          } else {
            acc[current] = 1;
          }
          return acc;
        }, {});

        let keys = [],
          k,
          i,
          len;

        for (k in occurence) {
          if (occurence.hasOwnProperty(k)) {
            keys.push(k);
          }
        }

        // Sorting the keys
        keys.sort().reverse();

        len = keys.length;
        let sortedOccuranceArr = [];

        for (i = 0; i < len; i++) {
          k = keys[i];
          sortedOccuranceArr.push(occurence[k]);
        }

        let myMap = new Map();

        for (let i = 0; i < distinctElems.length; i++) {
          myMap.set(distinctElems[i], sortedOccuranceArr[i]);
        }

        for (let i = 0; i < applicants.length - 1; i++) {
          // Main logic for ranking
          if (applicants[i].totalScore === applicants[i + 1].totalScore) {
            sum = sum + indexFlag++;

            if (i === applicants.length - 2) {
              rank = sum / myMap.get(applicants[i].totalScore);
              rankArr.push(rank);
            }
          } else if (applicants[i].totalScore !== applicants[i + 1].totalScore) {
            rank = sum / myMap.get(applicants[i].totalScore);
            rankArr.push(rank);
            sum = indexFlag++;
            if (i === applicants.length - 2) {
              rank = --indexFlag;
              rankArr.push(rank);
            }
          }
        }

        let finalRanking = [];

        for (let i = 0; i < rankArr.length; i++) {
          for (let j = 0; j < sortedOccuranceArr[i]; j++) {
            finalRanking.push(rankArr[i]);
          }
        }

        for (let i = 0; i < applicants.length; i++) {
          await applicantsInfo.findOneAndUpdate(
            { studentNum: applicants[i].studentNum },
            { rank: parseFloat(finalRanking[i]) }
          );
        }

        // return response with posts, total pages, and current page
        res.status(200).json({
          applicants,
          totalPages,
          currentPage: page,
          limit,
          totalCount: count,
          providerNamesAndOpenings,
        });
      }
    } else {
      // return response with posts, total pages, and current page
      res.status(200).json({
        applicants,
        totalPages,
        currentPage: page,
        limit,
        totalCount: count,
        providerNamesAndOpenings,
      });
    }
  } catch (e) {
    res.status(400).json(e.message);
  }
});

module.exports = router;
