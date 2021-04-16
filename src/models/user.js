const mongoose = require('mongoose') //mongoose uses mongodb module behind the scenes
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

//When we create a mongoose model we're passing an object in as the second argument to model, behind the scenes, 
//Mongoose converts it into schema in order to take advantage of the middleware functionality.
//so, now we create a schema and pass that in.

const userSchema = new mongoose.Schema({
    //here we set up all the fields as properties on their object.
    name: { //in here we configure things about that field.We can configure validation,We can set up custom validation
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim:true,
        unique: true,
        lowercase: true,
        validate(value) { //u can define your own logic or use builtin validators
            if(!validator.isEmail(value))
                throw new Error("Invalid email")
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if(value < 0)
            throw new Error('Age must be a positive number')
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {
            if(value.toLowerCase().includes('password'))
                throw new Error("Password cannot be of value 'password' ")
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    //the file system actually gets wiped every time you deploy which means that we would lose data.
    //So instead of storing them on file system we'll add a field onto User model to store the image of binary data.
    avatar: {
        type: Buffer //This is going to allow us to store the buffer with our binary image data
    }
}, {
    timestamps: true
})

//it's virtual because we're not actually storing in the user database, it is just a way for a mongoose to figure out how these two things are related. It's a relationship between two entities.In this case between our user and our task
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id', //the local field is that is where that local data is stored.
    foreignField: 'owner' //foreign field is the name of the field on the other thing in this case on the task that's going to create this relationship and we set that up to be the owner 
})

//When serializing an object, JavaScript looks for a toJSON() property on that specific object. If the toJSON() property is a function, then that method customizes the JSON serialization behavior. JavaScript will then serialize the returned value from the toJSON() method.
userSchema.methods.toJSON = function() { //In specific situations, you want to customize the JSON output. For example,you want to remove sensitive data like a user password before serializing a user object and sending it.
    const user = this
    const userObject = user.toObject() //this helps to get raw object with just user data by removing operations such as save() added by mongoose
    
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

userSchema.methods.generateAuthToken = async function() {  //we r accessing a method defined on userSchema,not statics
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '5 days' }) //_id is an object id, so convert it into string
    
    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}


userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })

    if(!user)
        throw new Error("Invalid email/password")
    
    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch) 
        throw new Error("Invalid email/password")

    return user
}

//hash plain password before saving to User
userSchema.pre('save', async function(next) {//pre allows us to do something before an event occurs, in this case, before user is saved. Note here noraml funstion is used coz arrow funstions do not have this binding
    const user =  this //this gives access to the user abt to be saved

    if(user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()//The whole point of this is to run some code before a user is saved.But how does it know when we're done running our code.Now it could just say when the function is over.But that wouldn't account for any asynchronous process which might be occurring.So that's why next is provided.We simply call next when we're done right here.Now if we never call next,it's just going to hang forever.
}) 

//delete tasks associated with user when user is gonna be deleted
userSchema.pre('delete', async function(next) {
    const user = this
    Task.deleteMany({ owner: user._id })
    next()
})

//creating User model using the schema mentioned above
const User = mongoose.model('User', userSchema) //this is going to allow us to take advantage of middleware.

module.exports = User

// //above we have our model defined we can create instances of that model to actually add documents to the database.
// const me = new User({
//     name: 'Sushmitha',
//     email: 'sush@GMAIL.com',
//     age: 6,
//     password: 'hellothere'
// })

// me.save().then(() => { //here we get access to model instance 'me' once again, so no need to mention again
//     console.log(me)
// }).catch((error) => {
//     console.log('Error!', error)
// })

