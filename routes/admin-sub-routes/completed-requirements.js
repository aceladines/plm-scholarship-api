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

router.get('/*',  async (req,res) =>{

    let options = {
        approvalStatus: 'APPROVED'
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
        const applicants = await applicantsInfo.find(options)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        // get total documents in the Posts collection
        const count = await applicantsInfo.countDocuments({approvalStatus: 'APPROVED'});

        // return response with posts, total pages, and current page
        res.status(200).json({
            applicants,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit,
            totalCount: count,
        });

    }
    catch (e) {
        res.status(500).json(e.message);
    }
})

module.exports = router