const express = require('express');
const router = express.Router();
applicationForm = require('./models/application')

// Create one application
router.post('/',async (req,res)=>{
    try {
        const apply = await applicationForm.create(req.body)
        res.status(200).json({message: 'Application successful'})
    }catch (e) {
        res.status(500).json({error: e.message ,message: 'Error when creating application'})
    }
})

module.exports = router