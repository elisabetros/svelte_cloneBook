const router = require('express').Router();
const formidable = require("formidable")
const detect = require("detect-file-type")
const {v1: uuidv1} = require("uuid")
const path = require("path")
const fs = require("fs") //part of node.js
const ObjectId = require('mongodb').ObjectId
const auth = require('../middleware/checkToken')


router.get('/posts', auth.checkToken, async (req, res) => {
    const { user }  = req.decoded
    const userCollection = db.collection('users')
    await userCollection.find
})

router.post('/post', auth.checkToken, async (req, res) => {
    const userCollection = db.collection('users')
    const { user } = req.decoded
    const { post } = req.body
    if(!post){
        return res.status(500).send({error: 'Missing fields'})
    }
    userCollection.findOneAndUpdate({_id:ObjectId(user._id)}, {$push:{'posts': {_id: new ObjectId(), 'postContent':post}}}, (err, dbresponse) => {
        if(err){
            return res.status(500).send({error: 'Something went wrong, please try again'})
        }
        return res.status(200).send({ dbresponse })
    })
})

router.post('/postWithImage', auth.checkToken, (req, res) => {
    const userCollection = db.collection('users')
    const { user } = req.decoded
    const form = new formidable.IncomingForm()
    form.parse(req, (err, fields, files) => {
        if(err){return res.send("error in file")}
        
        detect.fromFile(files.picture.path, (err, result) => {
            // console.log(result.ext)
            const pictureName = uuidv1()+"."+result.ext
            // console.log(pictureName) // ed671140-69ea-11ea-9ec7-9ff298c14d8c.jpg
            const allowedImageTypes = ["jpg", "jpeg", "png"]
            if(!allowedImageTypes.includes(result.ext)){
                return res.send("image not allowed")
            }
            const oldPath = files.picture.path
            const newPath = path.join(__dirname,"..", "pictures", "postPictures", pictureName)
            fs.rename(oldPath, newPath, async err => {
                if(err){console.log("cannot move file"); return;}
            
            userCollection.findOneAndUpdate({_id:ObjectId(user._id)}, {$push:{'posts': {_id: new ObjectId(), 'postContent':fields.postContent, 'postImg': pictureName}}}, (err, dbresponse) => {
                if(err){
                    return res.send({err})
                }
                return res.send({dbresponse})
            })
            })
        })
    })
})


router.put('/post', auth.checkToken, async (req, res) => {
    const userCollection = db.collection('users')
    const { postID, newPostContent } = req.body
    userCollection.findOneAndUpdate({'posts._id': ObjectId(postID)}, {$set:{'posts.$.postContent': newPostContent}}, (err, dbResponse) => {
        if(err){
            return res.status(500).send({error: err})
        }
        return res.status(200).send({dbResponse})
    })
})

router.delete('/post', auth.checkToken, async (req, res) => {
    const userCollection = db.collection('users')
    const { postID } = req.body
    const { user } = req.body
    userCollection.findOneAndUpdate({'posts._id': ObjectId(postID)}, {$pull:{'posts':{_id: ObjectId(postID)}}}, (err, dbResponse) => {
        if(err){
            return res.status(500).send({error: err})
        }
        return res.status(200).send({dbResponse})
    })
})

router.post('/likePost', auth.checkToken, async (req, res) => {
    const userCollection = db.collection('users')
    const { postID } = req.body
    const { user } = req.decoded
    userCollection.findOneAndUpdate({'posts._id': ObjectId(postID)}, {$push:{'posts.$.likes':{ 'firstname': user.firstname, 'lastname': user.lastname }}}, (err, dbResponse) => {
        if(err){
            return res.status(500).send({error: err})
        }
        return res.status(200).send({dbResponse})
    })
})

router.delete('/likePost', auth.checkToken, async (req, res) => {
    const userCollection = db.collection('users')
    const { postID } = req.body
    const { user } = req.decoded
//   see if user already liked post
    userCollection.findOneAndUpdate({'posts._id': ObjectId(postID)}, {$pull:{'posts.$.likes':{ 'userID': user._id, 'firstname': user.firstname, 'lastname': user.lastname }}}, (err, dbResponse) => {
        if(err){
            return res.status(500).send({error: err})
        }
        return res.status(200).send({dbResponse})
    })
})

module.exports = router;