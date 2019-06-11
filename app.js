if (process.env.NODE_ENV === "dev") {
  require("dotenv-json")();
}

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

const multer = require("multer");
const multerS3 = require("multer-s3");
const aws = require("aws-sdk");
aws.config.update({
  accessKeyId: process.env.ACCESS_KEY_ID,
  region: "eu-west-1",
  secretAccessKey: process.env.SECRET_ACCESS_KEY
});

const s3 = new aws.S3();
const upload = multer({
  storage: multerS3({
    acl: "public-read",
    bucket: "imgupldrbucket",
    metadata(req, file, cb) {
      cb(null, { fieldName: "file.fieldname" });
    },
    key(req, file, cb) {
      cb(null, Date.now().toString());
    },
    s3
  })
});

const singleUpload = upload.single("image");

app.post("/image-upload", (req, res) => {
  singleUpload(req, res, err => {
    if (err) {
      return res.status(422).send({
        errors: [{ title: "Image Upload Error", detail: err.message }]
      });
    }

    const imageUrl = req.file.location;

    const data = {};
    data.imageUrl = imageUrl;
    data.timestamp = Date.now();
    db.insert(data, (err, doc) => {
      if (err) {
        console.log(err);
        res.json(err);
      }
      res.json(doc);
    });
  });
});

app.get("/", (req, res) => res.send("Hello World!"));

app.get("/images", (req, res) => {
  db.find({ imageUrl: { $exists: true } }, function(err, docs) {
    if (err) {
      console.log(err);

      res.end();
    }
    res.json(docs);
  });
});

app.post("/love", (req, res) => {
  const { imageId, personId } = req.body;

  const like = {
    _id: imageId,
    personId
  };

  db.update({ imageUrl: imageId }, { $push: { likes: personId } }, function(
    err,
    docs
  ) {
    if (err) {
      console.log(err);

      res.end();
    }
    res.json(docs);
  });
});

if (process.env.NODE_ENV === "dev") {
  app.listen(process.env.PORT || 3000, () =>
    console.log("All is ok, sit back and relax!")
  );
} else {
  module.exports = app;
}
