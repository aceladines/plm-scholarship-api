require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const mongoString = process.env.ATLAS_URI || process.env.MONGO_URI;
const cors = require('cors');
const helmet = require('helmet');
const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.set('strictQuery', true);
mongoose.connect(mongoString);
const database = mongoose.connection;
const port = process.env.PORT || 5000;

// Will run once if DB is initialized and connected successfully.
database.once('connected', () => {
    console.log('Database Connected');
});

//Routes
const applicationRouter = require('./routes/application')
app.use('/application', applicationRouter)


// If endpoint does not exist will return an error message
app.use(function (req, res) {
    res.status(404).send({
        error: {
            errors: [{
                domain: 'global', reason: 'notFound', message: 'Not Found',
                description: 'Couldn\'t find the requested resource \'' + req.originalUrl + '\''
            }], code: 404, message: 'Not Found'
        }
    });
});

app.listen(port, () => {
    console.log(`Server Started at ${port}`);
});
