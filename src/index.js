const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/userRouter')
const taskRouter = require('./routers/taskRouter')

const app = express()
const port = process.argv.PORT || process.env.PORT //This is where environment variables are stored and we access the port environment variable which is provided by Heroku.

// app.use((req,res,next) => { //to register a middleware function of our own
//     console.log(req.method, req.path)

//     //Your middleware function can do as simple as logging out a message or something as complex as validating a token
//     //and making sure that user exists in the database.But it's your job to call next,if the route handler in the chain should run 
//     //If this middleware function doesn't call next,The root handler is never going to run.
//     next()
// })

// app.use((req, res, next) => {
//     res.status(503).send("Site is currently under maintainance, Please try again later") 
// })



app.use(express.json()) //It's going to automatically parse incoming Json to an object so we can access it in our request handlers such as req.body
app.use(userRouter) //we have to register our new router with our existing app.
app.use(taskRouter)

//without middleware - new request->request route handler
//with middleware - new request -> do something(until next is called) -> request route handler

app.listen(port, () => {
    console.log('Server is up on ' + port)
})

//using encryption algorithm can always turn the random series of characters back to original value,but hashing algorithms do not.
// const bcrypt = require('bcryptjs')

// const myFunction = async () => {
//     const password = 'purpleyou'
//     const hashedPassword = await bcrypt.hash(password, 8) //8 indicates no. of rounds hashing algorithm shd execute

//     const isMatch = await bcrypt.compare('purpleyou', hashedPassword)
//     console.log(isMatch)
// }

// myFunction()


// const jwt = require('jsonwebtoken')
// const myFunction = async () => {
//     const token = jwt.sign({ _id: 'abc123' }, 'nodejscourse', { expiresIn: '5 days' }) //object contains the data that's going to be embedded in your token.we r using JWT is for authentication.The only thing we really need to store inside of here is a unique identifier for the user who's being authenticated.In this case the user's I.D.the second argument this is a secret.This is gonna be used to sign the token making sure that it hasn't been tampered with or altered in any way. All we need to do for this one is provide a random series of characters. 
//     console.log(token)

//     const data = jwt.verify(token, 'nodejscourse')
//     console.log(data)
// }
// //return value from sign is your new token.In our case,it's our authentication token, this token will be provided to the client and then they can use the token later on to perform those privileged operations like creating a task.
// myFunction()


//the JSON.stringify() function looks for functions named toJSON in the object being serialized.
//If an object has toJSON function, JSON.stringify() calls toJSON() and serializes the return value from toJSON() instead.
// const pet = {
//     name: 'Snuffy',
//     age: 4
// }

// pet.toJSON = function() {
//     console.log(pet)
//     console.log(this)
//     delete pet.age
//     return this
// }

// console.log(JSON.stringify(pet))

//env-cmd -> This NPM module is going to load in the environment variables we defined in that env file and then it's going to make sure they're available to our nodejs application 

//in package.json, it's now our job to tell env-cmd to load in the environment variables and provide them to our project when using the dev script(here we provide path to enviroment variable file)