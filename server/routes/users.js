const router = require('express').Router();
const ObjectId = require('mongodb').ObjectId
const auth = require('../middleware/checkToken')
const bcrypt = require('bcryptjs')
const saltRounds = 10;
const formidable = require('formidable')
const detect = require("detect-file-type")
const {v1: uuidv1} = require("uuid")
const path = require("path")
const fs = require("fs") //part of node.js

let jwt = require('jsonwebtoken');
const config = require('../config/jwtKey');


router.get('/users', async (req, res) => {
    const collection = db.collection('users')
    collection.find().toArray((err, result) => {
        if(err){
            console.log('error'); 
            return;
        }
        // console.log('OK')         
        return res.send(result)
    })
})
router.post('/user/register', async (req, res) => {
    const userCollection = db.collection('users')
    const { firstname, lastname, email, password, repeatPassword } = req.body
    if(!firstname || !lastname || !password || !email || !repeatPassword){
        return res.status(500).send({error: "Missing fields"})
    }
    if(!/\S+@\S+\.\S+/.test(email)){
        return res.status(500).send({error: 'Email invalid'})
    }
    if(password.length <8){
        return res.status(500).send({error: "Password too short"})
    }
    if(password !== repeatPassword){
        return res.status(500).send({error: "Passwords don't match"})
    }bcrypt.hash(password, saltRounds, async (error, hashedPassword) => {
        if(error){
            return res.status(500).send({ error: "Couldn't hash password" })
        }
        userCollection.insertOne({ 
            firstname,
            lastname,
            email,
            password: hashedPassword,
            isLoggedIn:false
        }, function(err, result) {
            if(err){
                console.log(err);
                 return res.statur(500).send({error: 'Could not insert'});
                }
           return res.status(200).send(result.insertedId)
        })           
    })
})

router.put('/user/login', async (req, res) => {
    const userCollection = db.collection('users')
    const { email, password } = req.body
    if(!email || !password){
        return res.status(500).send({error: 'Missing fields'})
    }
    if(password<8){
        return res.status(500).send({error: 'Password too short'})
    }
    if(!/\S+@\S+\.\S+/.test(email)){
        return res.status(500).send({error: 'Email invalid'})
    }
    const user = await userCollection.findOne({'email':email})
    if(!user){
        return res.status(500).send({error: 'Email or password wrong'})
    }
    bcrypt.compare(password, user.password, async (error, isSame) => {
        if(error){
            return res.status(500).send({error:'Could not sign in, please try again'})
        }
        if(!isSame){
            return res.status(500).send({error: 'Wrong username or password'})
        }else{
            userCollection.findOneAndUpdate({_id:user._id}, {$set:{isLoggedIn:true}}, (err, response) => {
                if(err){
                    console.log(err); 
                    return res.status(500).send({error: 'Login failed'})
                }
                delete user.password
                jwt.sign({user}, config.secretKey, { expiresIn: '24h' } ,(err, token) => {
                    if(err) {
                      console.log(err) 
                     return res.status(500).send({error: 'Could not create token'})
                } 
                return res.status(200).send({ response, token })
                });
            })
        }
    })
})

router.get('/user/data', auth.checkToken, (req, res) => {
    //verify the JWT token generated for the user
   const authorizedData = req.decoded
 if(req.decoded){
     return res.status(200).send(authorizedData)
 }
});



router.put('/user/logout', auth.checkToken, async (req, res) => {
    const userCollection = db.collection('users')
    const { user } = req.decoded
    console.log(user._id)
   
    await userCollection.findOneAndUpdate({_id: ObjectId(user._id)}, {$set:{isLoggedIn:false}}, (err, dbResponse) => {
            if(err){console.log(err); return;}
            // console.log(user)
            return res.status(200).send({response: dbResponse})
        })
        console.log(userToLogout )  
})

router.post('/user/profilePicture', auth.checkToken, async (req, res) => {
    const userCollection = db.collection('users')
    const form = new formidable.IncomingForm()
    const { user } = req.decoded

    const userToUpdate = await userCollection.findOne({_id: ObjectId(user._id)})
    // if(userToUpdate.hasOwnProperty('profilePicture')){
    //     fs.unlinkSync(user.profilePicture)
    // }
    form.parse(req, (err, fields, files) => {
        if(err){return res.send("error in file")}
        
        detect.fromFile(files.picture.path, (err, result) => {
            // console.log(result.ext)
            const pictureName = uuidv1()+"."+result.ext
            // console.log(pictureName) // ed671140-69ea-11ea-9ec7-9ff298c14d8c.jpg
            const allowedImageTypes = ["jpg", "jpeg", "png"]
            if(! allowedImageTypes.includes(result.ext)){
                return res.send("image not allowed")
            }
            const oldPath = files.picture.path
            const newPath = path.join(__dirname,"..", "pictures", "profilePictures", pictureName)
            fs.rename(oldPath, newPath, async err => {
                if(err){console.log("cannot move file"); return;}
                userCollection.findOneAndUpdate({_id:ObjectId(user._id)}, {$set:{'profilePicture': pictureName}}, (err, dbResponse) => {
                    if(err){
                        return res.status(500).send('Something went wrong, please try again')
                    }
                    const user = dbResponse.value;
                    jwt.sign({user}, config.secretKey, { expiresIn: '24h' } ,(err, token) => {
                        if(err) {
                        console.log(err) 
                        return res.status(500).send({error: 'Could not create token'})
                        } 
                        return res.send({token, dbResponse})
                    })
                })
            })
        })
    })
})

router.delete('/user/profilePicture', auth.checkToken, async (req, res) => {
    const userCollection = db.collection('users')
    const { user } = req.decoded
    userCollection.findOneAndUpdate({_id:ObjectId(user._id)}, {$unset:{'profilePicture': ''}}, (err, dbResponse) => {
        if(err){
            return res.status(500).send('Something went wrong, please try again')
        }
        console.log(dbResponse)
        const user = dbResponse.value;
                jwt.sign({user}, config.secretKey, { expiresIn: '24h' } ,(err, token) => {
                    if(err) {
                      console.log(err) 
                     return res.status(500).send({error: 'Could not create token'})
                } 
            return res.send({token, dbResponse})
            })
        })
})

router.put('/user/update', auth.checkToken, async (req, res) => {
    let { newFirstname, newEmail, newLastname } = req.body
    const { user } = req.decoded
    if(!newFirstname){
        newFirstname = user.firstname
    }
    if(!newLastname){
        newLastname = user.lastname
    }
    if(!newEmail){
        newEmail = user.email
    }
    const userCollection = db.collection('users')
    await userCollection.findOneAndUpdate({_id: ObjectId(user._id)}, {$set:{
            firstname:newFirstname, 
            lastname: newLastname,
            email: newEmail }}, (err, dbResponse) => {
                if(err){
                    console.log(err); 
                    return res.status(500).send({error: 'Something went wrong, please try again'})
                }
                return res.status(200).send({response: dbResponse})
            })
})

router.delete('/user', auth.checkToken, async (req, res) => {
    const userCollection = db.collection('users')
    const { user } = req.decoded
    await  userCollection.deleteOne({_id: ObjectId(user._id)}, (err, dbResponse) => {
        if(err){
            console.log(err); 
            return res.status(500).send({error: 'Something went wrong, please try again'})
        }
        // console.log(user)
        return res.status(200).send({response: dbResponse})
    })
})



module.exports = router;