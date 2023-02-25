const express = require('express');
const router = express.Router();
applicantsInfo = require('../../models/application')

router.put('/move', async (req,res) =>{
    // Dummy Field
    const toMove = {
        studentNumber: [202011759],
        provider: 'SM-Scholarship'
    }

    try {
        for (const student in toMove.studentNumber) {
            const movedStudents = await applicantsInfo.findOneAndUpdate({studentNum: toMove.studentNumber[student]}, {scholarshipProvider: toMove.provider})
        }

        res.status(200).json({message: 'Successfully moved student/s!'})
    }catch (e) {
        res.status(500).json({error: e.message})
    }
})

router.get('/*', async (req, res) => {
    try {

        // execute query with page and limit values
        const studentInfos = await applicantsInfo.find({ approvalStatus: 'APPROVED' })
            .sort({ totalScore: -1 })
            .exec();

        // get total documents in the Posts collection
        const count = await applicantsInfo.countDocuments({ approvalStatus: 'APPROVED' });


        if(studentInfos.length === 0){
            res.status(200).json({message: 'No data'})
        }
        else if(studentInfos.length === 1){
            await applicantsInfo.findOneAndUpdate({studentNum: studentInfos[0].studentNum}, {rank: 1})

            // return response with posts, total pages, and current page
            res.status(200).json({
                studentInfos,
                totalCount: count
            });
        }
        else {

            let sum = 1;
            let indexFlag = 2
            let rank = 0
            let rankArr = []
            let totalScoreArr = []

            // Push the totalScore into 'totalScoreArr'
            for (let i = 0; i < studentInfos.length; i++) {
                totalScoreArr.push(studentInfos[i].totalScore)
            }


            // Making a set from 'totalScoreArr'
            let set = new Set(totalScoreArr)
            let distinctElems = [...set]

            console.log(totalScoreArr)

            // Counting occurences of 'totalScore' values
            let occurence = totalScoreArr.reduce(function(acc, current) {
                if (acc[current]) {
                    acc[current]++;
                } else {
                    acc[current] = 1;
                }
                return acc;
            }, {});

            console.log("Occurence: " + JSON.stringify(occurence))

            let keys = [],k ,i ,len

            for (k in occurence) {
                if (occurence.hasOwnProperty(k)) {
                    keys.push(k);
                }
            }

            // Sorting the keys
            keys.sort().reverse()
            console.log(keys)

            len = keys.length;
            let sortedOccuranceArr = []

            for (i = 0; i < len; i++) {
                k = keys[i];
                console.log(sortedOccuranceArr.push(occurence[k]));
            }


            let myMap = new Map();

            for (let i = 0; i < distinctElems.length; i++) {
                myMap.set(distinctElems[i], sortedOccuranceArr[i]);
            }


            for (let i = 0; i < studentInfos.length - 1; i++) {

                // Main logic for ranking
                if (studentInfos[i].totalScore === studentInfos[i + 1].totalScore) {
                    sum = sum + indexFlag++

                    if (i === studentInfos.length - 2) {
                        rank = sum / myMap.get(studentInfos[i].totalScore);
                        rankArr.push(rank);
                    }
                } else if (studentInfos[i].totalScore !== studentInfos[i + 1].totalScore) {

                    rank = sum / myMap.get(studentInfos[i].totalScore);
                    rankArr.push(rank)
                    sum = indexFlag++
                    if (i === studentInfos.length - 2) {
                        rank = --indexFlag;
                        rankArr.push(rank)
                    }
                }

            }

            let finalRanking = []

            for (let i = 0; i < rankArr.length ; i++) {
                for (let j = 0; j < sortedOccuranceArr[i]; j++) {
                    finalRanking.push(rankArr[i])
                }
            }

            for (let i = 0; i < studentInfos.length; i++) {
                await applicantsInfo.findOneAndUpdate({studentNum: studentInfos[i].studentNum},{rank: parseFloat(finalRanking[i])})
            }

            // return response with posts, total pages, and current page
            res.status(200).json({
                studentInfos,
                totalCount: count
            });

        }


    } catch (e) {
        res.status(404).json(e.message);
    }
});

module.exports = router