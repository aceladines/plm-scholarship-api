const express = require('express');
const router = express.Router();
applicantsInfo = require('../../models/application')
const mail = require('../../utils/mailer')

router.post('/approve', async (req, res) => {
    const email = req.body.email

    let gwaEquiv = 0;
    let incEquiv = 0;
    let totalScore = 0;

    const gwaEquivArray = [
        {range: [1, 1.24], value: 7},
        {range: [1.25, 1.49], value: 6},
        {range: [1.50, 1.74], value: 5},
        {range: [1.75, 1.99], value: 4},
        {range: [2, 2.24], value: 3},
        {range: [2.25, 2.49], value: 2},
        {range: [2.50, Infinity], value: 1}
    ];

    const incEquivArray = [
        {range: [0, 69_999], value: 7},
        {range: [70000, 139_999], value: 6},
        {range: [140_000, 209_999], value: 5},
        {range: [210_000, 279_999], value: 4},
        {range: [280_000, 349_999], value: 3},
        {range: [350_000, 419_999], value: 2},
        {range: [420_000, Infinity], value: 1}
    ];

    function findValue(arr, val) {
        for (let i = 0; i < arr.length; i++) {
            if (val >= arr[i].range[0] && val <= arr[i].range[1]) {
                return arr[i].value / 2;
            }
        }
    }

    const user = await applicantsInfo.findOne({ email });

    if(user) {

        gwaEquiv = findValue(gwaEquivArray, user.currentGwa);
        incEquiv = findValue(incEquivArray, user.householdIncome);
        totalScore =gwaEquiv + incEquiv

        try {
            applicantsInfo.findOneAndUpdate({email: user.email}, {
                approvalStatus: 'APPROVED',
                EquivGWA: gwaEquiv,
                EquivInc: incEquiv,
                totalScore
            }, async (err) => {
                if (!err) {

                    let sendMail = {
                        TO: email,
                        option: 0
                    };

                    const mailInfo = await mail.sendEmail(sendMail);
                    res.status(200).json({message: 'Applicant approved!', mailInfo})
                }
            })
        }catch (e) {
            res.status(500).json({message:e.message})
        }
        }
    else{
        res.status(404).json({message: 'Applicant does not exists!'})
    }
})

// Get all data whose approvalStatus = (APPROVED, RESUBMISSION)
router.get('/*',  async (req,res) =>{

    let options = {
        $or: [{approvalStatus: 'PENDING'}, {approvalStatus: 'RESUBMISSION'}]
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
        const count = await applicantsInfo.countDocuments({$or: [{approvalStatus: 'PENDING'}, {approvalStatus: 'RESUBMISSION'}]});

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