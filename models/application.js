const { Schema, model, models } = require('mongoose');

const studentRegFormFileSchema = new Schema({
    fileName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true

    }
});

const studentRegFormFilesSchema = new Schema({
    scholarshipForm: studentRegFormFileSchema,
    form137_138: studentRegFormFileSchema,
    IncomeTax: studentRegFormFileSchema,
    SnglParentID: studentRegFormFileSchema,
    CoR: studentRegFormFileSchema,
    CGM: studentRegFormFileSchema,
    ScholarshipLetter: studentRegFormFileSchema,
    PlmID: studentRegFormFileSchema
});

const applicationForm = new Schema({
    studentNum: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true
    },
    middleName: {
        type: String,
    },
    lastName: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    college: {
        type: String,
        required: true
    },
    course: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    mobileNum: {
        type: Number,
        required: true
    },
    birthdate: {
        type: Date,
        required: true
    },
    householdIncome: {
        type: Number,
        required: true
    },
    currentGwa: {
        type: Number,
        required: true
    },
    applied: {
        type: Boolean,
        required: true
    },
    dateApplied: {
        type: Date,
        required: true
    },
    approvalStatus: {
        type: String,
        required: true
    },
    EquivGWA: {
        type: Number
    },
    EquivInc: {
        type: Number
    },
    totalScore: {
        type: Number
    },
    incFlag: {
        type: Number
    },
    rank: {
        type: Number
    },
    scholarshipProvider:{
      type: String
    },
    providerOpeningDate:{
        type: Date
    },
    dateOfBecomingScholar:{
        type: Date
    },
    files: studentRegFormFilesSchema
});

const applicationFormData = models.applicationFormData || model('applicationFormData', applicationForm);

module.exports = applicationFormData;