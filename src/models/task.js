const mongoose = require('mongoose') //mongoose uses mongodb module behind the scenes

const taskSchema = new mongoose.Schema({
    description: {
        type:String,
        trim: true,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
})

const Task = mongoose.model('Task', taskSchema)

module.exports = Task

/*const task1 = new Task({
    description: 'Finish node js course    ',
    completed: false 
})

task1.save().then(() => {
    console.log(task1)
}).catch((error) => {
    console.log(error)
})*/

