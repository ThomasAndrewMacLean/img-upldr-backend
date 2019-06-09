const express = require("express");
const logger = require('volleyball');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors());

app.use(logger);
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true
    })
    );
    
    const Datastore = require("nedb");
    const db = new Datastore({ filename: "./database/data.db", autoload: true });
    
app.get("/", (req, res) => res.send("Hello World!"));

if (process.env.NODE_ENV === 'dev') {    
    app.listen(process.env.PORT || 3000, () =>
        console.log('All is ok, sit back and relax!')
    );
} else{
    module.exports = app;
}