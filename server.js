require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { Schema } = mongoose;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true});

const urlSchema = new Schema({
  original_url: String,
  short_url: Number,
});

let Url = mongoose.model('Url', urlSchema);

const createAndSaveUrl = (original_url, done) => {
  findUrlByOriginal(original_url, (err, data) => {
    if (err) {
      console.log(err);
      done(err);
    } else {
      if (data) {
        done(null, data);
      } else {
        Url.count((err, count) => {
          if (err) {
            console.log(err);
            done(err);
          } else {
            const url = new Url({
              original_url: original_url,
              short_url: count,
            });
            url.save((err, data) => {
              if (err) {
                console.log(err);
                done(err);
              } else {
                done(null, data);
              }
            });
          }
        });
      }
    }
  });
};

const findUrlByShort = (short_url, done) => {
  Url.findOne({short_url: short_url}, (err, data) => {
    if (err) {
      console.log(err);
      done(err);
    } else {
      done(null, data);
    }
  });
};

const findUrlByOriginal = (original_url, done) => {
  Url.findOne({original_url: original_url}, (err, data) => {
    if (err) {
      console.log(err);
      done(err);
    } else {
      done(null, data);
    }
  });
};

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(_req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(_req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl/new', function(req, res) {
  let url = req.body.url;
  createAndSaveUrl(url, (err, data) => {
    if (err) {
      console.log(err);
      res.json({error: err});
    } else {
      res.json({original_url: url, short_url: data.short_url});
    }
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

