const jwt = require('jsonwebtoken')
const User = require('../models/user')

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        // below line will find a user with the correct I.D. who has that authentication token still stored.
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })//tokens.token is going to look for a user that has a given token value in one of their array items in the tokens
       
        if(!user)
            throw new Error()

        req.token = token
        req.user = user //here we give the route handler access to the user & his token that we fetched from the database
        next()
    }
    catch(e) {
        res.status(401).send({error: 'Please Authenticate'})
    }
}

module.exports = auth