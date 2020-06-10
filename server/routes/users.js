const router = require('express').Router();

const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const saltRounds = 10;


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

router.post('/user/login', async (req, res) => {
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
                // add token
                return res.status(200).send({ response })
            })
        }
    })
})

router.post('user/logout', async (req, res) => {
    const userCollection = db.collection('users')
})

router.get('/posts', async (req, res) => {
    
})

router.post('/posts', async (req, res) => {
    const userCollection = db.collection('users')
    const { postTitle, postContent, postImage } = req.body
    if(!postTitle || !postContent){
        return res.status(500).send({error: 'Missing fields'})
    }
    if(postImage){
        return res.send('contains image')
    }
})




module.exports = router;