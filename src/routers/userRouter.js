const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeMail, sendCancellationMail } = require('../emails/account')

const router = new express.Router()

//we know when we just add that async definition it changes the behavior of the function, the function
//goes from returning whatever value you return to always returning a promise.
//Now the good news is that Express doesn't use the return value from this function anyways.
//At no point were we returning anything.EXPRESS Does not care what we return.
//Instead we use request and response to tell express what we want to do.

//to login
router.get('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken() //we r generating token for a single user instance,not on User object
        
        res.send({user, token}) 
    }
    catch(e) {
        console.log('Error!!', e)
        res.status(404).send(e)
    }
})

//to create users
router.post('/users', async (req, res) => {
    //console.log(req.body)
    const user = new User(req.body)
    
    try {
        await user.save()
        sendWelcomeMail(user.email, user.name)
        const token = await user.generateAuthToken()

        res.status(201).send({user, token})
    }
    catch(e) {
        res.status(400).send(e)
    }

    // user.save().then(() => {
    //     res.status(201).send(user) 
    // }).catch((error) => {
    //     res.status(400).send(error)
    // })
})

router.post('/users/logout', auth, async(req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => { //auth has setted req.user as user and tokens is a property available in users object with a list of all tokens
            return token.token != req.token //token is an object with property token, remember tokens is a list of objects, we are looping through each object now and accessing its property token
        })

        await req.user.save()
        res.send()
    }
    catch(e) {
        res.status(500).send(e)
    }
})

router.post('/users/logoutAll', auth, async (req,res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    }
    catch(e) {
        res.status(500).send(e)
    }
})

//to read a single user data
router.get('/users/me', auth, async (req, res) => { //to add middleware to an individual route,pass it as an argument to the get method before we pass in our route handler.
    res.send(req.user) //here JSON.stringify gets called on both user and token, then a call for toJSON() method is automatically done by stringify
    
    // try {
    //     const users = await User.find({})
    //     res.send(users)
    // }
    // catch(e) {
    //     res.status(500).send(e)
    // }
        
    // User.find({}).then((users) => {
    //     res.send(users)
    // }).catch((e) => {
    //     res.status(500).send()
    // })
})


//to update user data by id
router.patch('/users/me', auth, async (req, res) => { //to capture whatever value is put after 2nd slash, :id is the route parameter, which is dynamic value, using that, we can fetch user correctly
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name','email','age','password']

    const isValidUpdate = updates.every((update) => { //if u get true for each value in updates, every will return true, if any one value returns false, then every returns false 
        return allowedUpdates.includes(update)
    })

    if(!isValidUpdate) 
        return res.status(400).send({error: 'Invalid updates!!'})

    try {
        console.log(req.body)
        //req.params() this contains all the route parameter, in this case, it's an object with property id
        //we r using this method to update,coz sometimes mongoose bypass the middlewares while using findByIdAndUpdate
        //const user = User.findById(req.params.id) //mongoose automatically converts string id to object id

        updates.forEach((update) => {
            req.user[update] = req.body[update] // here, u can't use dot notation to access property of user since update variable is dynamic
        })

        await req.user.save()

        //new = true.This is going to return the new user as opposed to the existing one that was found before the update.
        //runValidators=true,This is going to make sure that we do run validation for the update.So if I tried to update my name to something non-existent I want to make sure that fails,so any time we're allowing the user to write data to the database.We want to make sure we validate it so that it comes in the format we're expecting.
        //const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})
        
        res.send(req.user)
    }
    catch(e) {
        res.status(400).send()
    }
})

//to delete user
router.delete('/users/me', auth, async (req, res) => {
    try {
        // const user = await User.findByIdAndDelete(req.user._id) //req.user is provided by auth middleware
        // if(!user)//even if there is no user, try block will run even for undefined, so to prevent that,check this way
        //     res.status(404).send()

        await req.user.remove()
        sendCancellationMail(req.user.email, req.user.name)
        res.send(req.user)
    }
    catch(e) {
        res.status(500).send(e)
    }
})

//configure multer
const upload = multer({  //creating new instance of multer
    //dest: 'avatars', if dest is removed, multer will no longer save images to avatars directory, instead it's simply going to pass that data through to our function so we can do something with it lyk save()
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) { //this will be called internally by multer
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            cb(new Error('Please upload a .jpg, .jpeg or .png file'))
        }

        cb(undefined, true) //true indicates user can be prompted to upload the selected file
    }
})

//form-data->This is where we can specify the binary data for a file whether it's an image or something else that we want to upload to the server.
//set end point where the client will be able to upload these files, to set the end point,use POST method
//We first provide our string argument then we provide whatever comes back from the call to single as the second argument. And finally we provide our root handler as that third and final argument.
//here we're telling multer to look for a file called avatar when the request comes in.(key value - avatar) 
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req,res) => { //when it comes to actually adding support for upload, what we get access to is multer middleware
    //Multer processes the image data and validate it as we've set up above but it will pass the validated data to 
    //our callback function so we can access it.The data is accessible on request.file.
    //This is an object which contains all of those properties we explored before about the file and we're
    //gonna be using one called buffer, buffer contains a buffer of all of the binary data for that file.
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer() //reformatting image to png
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message})
})


router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
    
})

router.get('/users/:id/avatar', async(req, res) => {
    try {
        const user = await User.findById(req.params.id)
        
        if(!user || !user.avatar) 
            throw new Error({error: 'No image exists'})

        res.set('Content-Type', 'image/png') //by default, it is 'application/json'
        res.send(user.avatar)
    }
    catch(e) {
        res.status(404).send(e)
    }
})

module.exports = router
