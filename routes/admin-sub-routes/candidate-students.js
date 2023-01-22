const express = require('express');
const router = express.Router();
applicantsInfo = require('../../models/application')



// Default
router.get('/*',  async (req,res) =>{

    let options = {
        approvalStatus: 'APPROVED',
    };

    if(req.query.provider) options.scholarshipProvider = req.query.provider

    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    try {
        // execute query with page and limit values
        const applicants = await applicantsInfo.find(options)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        // get total documents in the Posts collection
        const count = await applicantsInfo.countDocuments(options);

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