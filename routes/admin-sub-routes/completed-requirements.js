const express = require("express");
const router = express.Router();
applicantsInfo = require("../../models/application");
providerOpeningDates = require("../../models/providerOpeningDates");

router.put("/move", async (req, res) => {
  // Dummy Field
  const toMove = {
    studentNumber: [3],
    provider: "SM-Scholarship",
    providerOpeningDate: "2023-03-25",
  };

  try {
    //Update the status of each moved student into 'APPROVED'
    let movedStudents;

    for (const student in toMove.studentNumber) {
      movedStudents = await applicantsInfo.findOneAndUpdate(
        {
          $and: [
            { studentNum: toMove.studentNumber[student] },
            { approvalStatus: "PENDING" },
          ],
        },
        {
          scholarshipProvider: toMove.provider,
          providerOpeningDate: toMove.providerOpeningDate,
          approvalStatus: "APPROVED",
        }
      );
    }

    if (movedStudents !== null) {
      const filter = {
        "providerAndDates.providerName": toMove.provider,
        "providerAndDates.providerOpeningDate": toMove.providerOpeningDate,
      };
      const update = {
        $setOnInsert: {
          providerAndDates: {
            providerName: toMove.provider,
            providerOpeningDate: toMove.providerOpeningDate,
          },
        },
      };
      const options = { upsert: true };

      const result = await providerOpeningDates.updateOne(
        filter,
        update,
        options
      );

      if (result.upsertedCount > 0) {
        console.log(
          `Provider and provider opening date added to existing document!`
        );
      }
      res.status(200).json({ message: "Successfully moved student/s!" });
    } else {
      res.status(400).json({ message: "No student/s to move!" });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/*", async (req, res) => {
  try {
    // execute query with page and limit values
    const studentInfos = await applicantsInfo
      .find({ approvalStatus: "APPROVED" })
      .sort({ totalScore: -1 })
      .exec();

    // get total documents in the Posts collection
    const count = await applicantsInfo.countDocuments({
      approvalStatus: "APPROVED",
    });

    if (studentInfos.length === 0) {
      res.status(200).json({ message: "No data" });
    } else if (studentInfos.length === 1) {
      await applicantsInfo.findOneAndUpdate(
        { studentNum: studentInfos[0].studentNum },
        { rank: 1 }
      );

      // return response with posts, total pages, and current page
      res.status(200).json({
        studentInfos,
        totalCount: count,
      });
    } else {
      let sum = 1;
      let indexFlag = 2;
      let rank = 0;
      let rankArr = [];
      let totalScoreArr = [];

      // Push the totalScore into 'totalScoreArr'
      for (let i = 0; i < studentInfos.length; i++) {
        totalScoreArr.push(studentInfos[i].totalScore);
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

      for (let i = 0; i < studentInfos.length - 1; i++) {
        // Main logic for ranking
        if (studentInfos[i].totalScore === studentInfos[i + 1].totalScore) {
          sum = sum + indexFlag++;

          if (i === studentInfos.length - 2) {
            rank = sum / myMap.get(studentInfos[i].totalScore);
            rankArr.push(rank);
          }
        } else if (
          studentInfos[i].totalScore !== studentInfos[i + 1].totalScore
        ) {
          rank = sum / myMap.get(studentInfos[i].totalScore);
          rankArr.push(rank);
          sum = indexFlag++;
          if (i === studentInfos.length - 2) {
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

      for (let i = 0; i < studentInfos.length; i++) {
        await applicantsInfo.findOneAndUpdate(
          { studentNum: studentInfos[i].studentNum },
          { rank: parseFloat(finalRanking[i]) }
        );
      }

      // return response with posts, total pages, and current page
      res.status(200).json({
        studentInfos,
        totalCount: count,
      });
    }
  } catch (e) {
    res.status(404).json(e.message);
  }
});

module.exports = router;
