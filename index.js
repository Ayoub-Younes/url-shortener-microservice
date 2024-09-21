const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const validUrl = require('valid-url')
const mongoose = require("mongoose");
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI);
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: false}))


// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'src', 'public')));

// Route to serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'views', 'index.html'));
});

// first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


// Create Schema Model
let urlSchema = new mongoose.Schema({
  url:{type:String , required:true},
  shortUrl:Number
});

// Add auto increment to shortUrl
urlSchema.pre('save', async function(next) {
  if (!this.shortUrl) {
    try {
      const latestUrl = await this.constructor.findOne({}).sort({ shortUrl: -1 });
      this.shortUrl = latestUrl ? latestUrl.shortUrl + 1 : 1;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

// Create Model
let Url = mongoose.model("url",urlSchema)

//API POST
app.post("/api/shorturl", async (req,res) => {

  let orgUrl = req.body.url
  if(!validUrl.isWebUri(orgUrl)){res.json({ error: 'invalid url' })}
  else{
    try{

      // Check if the URL already exists
      let existingUrl = await Url.findOne({url:orgUrl})
      if (existingUrl) {
        res.json({ original_url : orgUrl, short_url : existingUrl.shortUrl})
      }
      
      // Create a new URL document
      else {
        let newUrl = new Url({ url: orgUrl });
        await newUrl.save();  
        res.json({original_url : orgUrl, short_url : newUrl.shortUrl})
      }
    } catch (err) {
    console.log(err);
    }
  }
})

//API GET
app.get("/api/shorturl/:shorturl", async (req,res)=>{
  try{
    let url = await Url.findOne({shortUrl:req.params.shorturl})
    if(url){
      res.redirect(url.url)
    } else {
      res.json({error : "Invalid number"})
    }
  } catch {
    console.log(err);
  }
})


// listen for requests
const listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
