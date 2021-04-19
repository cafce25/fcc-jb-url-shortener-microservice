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

async function createAndSaveUrl(original_url) {
  let url_result = await findUrlByOriginal(original_url);
  if (url_result) {
    return url_result;
  }
  const url = new Url({
    original_url: original_url,
    short_url: await Url.countDocuments(),
  });
  return url.save();
}

async function findUrlByShort(short_url) {
  return await Url.findOne({short_url: short_url});
};

async function findUrlByOriginal(original_url) {
  return await Url.findOne({original_url: original_url});
}

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

const url_re = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;
function new_url(req, res) {
  let url = req.body.url;
  if (url_re.test(url)) {
    createAndSaveUrl(url).then(data => {
      const response = {original_url: url, short_url: data.short_url};
      res.json(response);
    }, err => {
      console.log(err);
      res.json({error: err});
    });
  } else {
    res.json({error: "invalid url"});
  }
}
app.post('/api/shorturl', new_url);
app.post('/api/shorturl/new', new_url);

app.get('/api/shorturl/:short_url', function(req, res) {
  findUrlByShort(req.params.short_url).then((url) => {
    if (url) {
      res.redirect(url.original_url);
    } else {
      res.json({'error': 'short url not found'});
    }
  }, err => {
    res.json({'error': err});
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

