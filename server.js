'use strict';
require('dotenv').config();
const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const URI ="mongodb+srv://user1:amri1977@freecodecamp.lsrd9.mongodb.net/stock-pricer?retryWrites=true&w=majority&appName=freecodecamp";
const mongoose = require('mongoose');
const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');
const databaseName = 'stock-pricer';
const app = express();
app.use(helmet());
app.use(helmet.contentSecurityPolicy({ directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"],
styleSrc: ["'self'"] }} ))
app.set('trust proxy',true); 
mongoose.Promise = global.Promise;

const start = async ()=>{
  await mongoose.connect(URI,{
    useNewUrlParser: true,
    useUnifiedTopology: true,

});
}

start();

const db = mongoose.connection
db.on('error',err => {console.error(err)})
db.once('open',()=>{
  console.log('Connected to' + databaseName)
})

process.on('SIGNIT', ()=>{
  db.close(()=>{
    console.log(`Closing connection to ${databaseName}`)
    process.exit(0)
  })
})

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
apiRoutes(app);  
    
//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

//Start our server and tests!
app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port " + process.env.PORT);
  if(process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch(e) {
        var error = e;
          console.log('Tests are not valid:');
          console.log(error);
      }
    }, 3500);
  }
});

module.exports = app; //for testing