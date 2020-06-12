const router = require('express').Router();
const ObjectId = require('mongodb').ObjectId
const auth = require('../middleware/checkToken')
const bcrypt = require('bcryptjs')
const saltRounds = 10;

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

})

router.put('/user/profilePicture', auth.checkToken, async (req, res) => {

})

router.delete('/user/profilePicture', auth.checkToken, async (req, res) => {

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