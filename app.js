const express = require("express");
const logger = require("volleyball");
const bodyParser = require("body-parser");
const cors = require("cors");
const monk = require("monk");

const app = express();

app.use(cors());

app.use(logger);
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
let db;
if (process.env.NODE_ENV === "dev") {
  const Datastore = require("nedb");
  db = new Datastore({
    filename: `./database/database-${process.env.NODE_ENV}.db`,
    autoload: true
  });
} else {
  const url = `mongodb+srv://dbUser:${
    process.env.MONGOPW
  }@cluster0-k1w1l.gcp.mongodb.net/test?retryWrites=true&w=majority`;
  const url2 = `mongodb://dbUser:${
    process.env.MONGOPW
  }@cluster0-shard-00-00-k1w1l.gcp.mongodb.net:27017,cluster0-shard-00-01-k1w1l.gcp.mongodb.net:27017,cluster0-shard-00-02-k1w1l.gcp.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority`;
  const monkdb = monk(url2);
  db = monkdb.get("data");
}

app.get("/", (req, res) => res.send("Hello World!"));

app.get("/data", (req, res) => {
  db.find({}, function(err, docs) {
    if (err) {
      console.log(err);

      res.end();
    }
    res.json(docs);
  });
});

app.post("/data", (req, res) => {
  const data = req.body;
  data.timestamp = Date.now();
  db.insert(data, (err, doc) => {
    if (err) {
      console.log(err);

      res.json(err);
    }
    res.json(doc);
  });
});

if (process.env.NODE_ENV === "dev") {
  app.listen(process.env.PORT || 3000, () =>
    console.log("All is ok, sit back and relax!")
  );
} else {
  module.exports = app;
}
