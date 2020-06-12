const express = require('express')
const app = express()

MongoClient = require('mongodb').MongoClient

// ############################

const url = 'mongodb://localhost:27017'
const dbName ='clonebook'
global.db = ''

// Connecting to server
MongoClient.connect(url, { useUnifiedTopology: true } ,(err, client) => {
    if(err){
        console.log('error'); 
        return;
    }
    console.log('connected to mongo')
    db = client.db(dbName)
})



app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// ############################

var cors = require('cors', );
const allowedOrigins = ['http://localhost:3000','https://www.valsdottir.net', 'https://valsdottir.net'];

app.use(cors({ 
    credentials:true,
    // origin: function(origin, callback){
    //     // allow requests with no origin 
    //     // (like mobile apps or curl requests)
    //   if(!origin) return callback(null, true);
    //   if(allowedOrigins.indexOf(origin) === -1){
    //     var msg = 'The CORS policy for this site does not ' +
    //               'allow access from the specified Origin.';
    //               return callback(new Error(msg), false);
    //   }
    //   return callback(null, true);
    // }
}));

// ############################

const userRoute = require('./routes/users')
const userPostRoute = require('./routes/user-posts')
app.use(userRoute)
app.use(userPostRoute)

// ############################

const port = process.env.PORT || 80

app.listen(port, (err) => {
    if(err){console.log("server couldn't connect");return;}
    console.log('server running on port', port)
})