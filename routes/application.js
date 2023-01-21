const express = require('express');
const { celebrate, Joi, errors, Segments } = require('celebrate');
const router = express.Router();
applicationForm = require('../models/application')

// Create one application
router.post('/',celebrate({
    [Segments.BODY]: Joi.object().keys({
        studentNum: Joi.string().trim().required(),
        firstName: Joi.string().trim().required(),
        middleName: Joi.string().trim(),
        lastName: Joi.string().trim().required(),
        gender: Joi.string().trim().required(),
        email: Joi.string().trim().email().required(),
        college: Joi.string().trim().required(),
        course: Joi.string().trim().required(),
        year: Joi.number().required(),
        mobileNum: Joi.number().required(),
        birthdate: Joi.string().trim().required(),
        householdIncome: Joi.number().required(),
        currentGwa: Joi.number().required(),
        applied: Joi.boolean().required(),
        approvalStatus: Joi.string().trim().required(),
    })
}),async (req,res)=>{
    try {
        const apply = await applicationForm.create(req.body)
        res.status(200).json({message: 'Application successful'})
    }catch (e) {
        res.status(500).json({error: e.message ,message: 'Error when creating application'})
    }
})

module.exports = router