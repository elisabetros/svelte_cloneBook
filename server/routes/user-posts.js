const router = require('express').Router();
const formidable = require("formidable")
const detect = require("detect-file-type")
const {v1: uuidv1} = require("uuid")
const path = require("path")
const fs = require("fs") //part of node.js

const auth = require('../middleware/checkToken')


router.get('/posts', async (req, res) => {
    
})

router.post('/posts', auth.checkToken, (req, res) => {
    const userCollection = db.collection('users')
    const form = new formidable.IncomingForm()
    form.parse(req, (err, fields, files) => {
        if(err){return res.send("error in file")}
        if(!fields.postText || !fields.postContent){
            return res.status(500).send({error: 'Missing fields'})
        }
        detect.fromFile(files.picture.path, (err, result) => {
            // console.log(result.ext)
            const pictureName = uuidv1()+"."+result.ext
            // console.log(pictureName) // ed671140-69ea-11ea-9ec7-9ff298c14d8c.jpg
            const allowedImageTypes = ["jpg", "jpeg", "png"]
            if(! allowedImageTypes.includes(result.ext)){
                return res.send("image not allowed")
            }
            const oldPath = files.picture.path
            const newPath = path.join(__dirname,".." ,"..", "pictures", pictureName)
            fs.rename(oldPath, newPath, err => {
                if(err){console.log("cannot move file"); return;}
               
               try{
                userCollection.findOneAndUpdate({_id:user._id}, {$push:{}})
                   
               }catch(ex){
                return res.status(500).send("System under update")
               }
            })
        })
    })
})

module.exports = router;