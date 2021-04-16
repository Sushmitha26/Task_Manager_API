const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')

const router = new express.Router()

//to create data for tasks
router.post('/tasks', auth, async (req, res) => {
    //const task = new Task(req.body)
    const task = new Task({
        ...req.body, //this will copy all parameters in body of request
        owner: req.user._id
    })
    try {
        await task.save()
        res.status(201).send(task)
    }
    catch(e) {
        res.status(400).send(e)
    }
})

//to read all data
//GET /tasks?completed=false
//GET /tasks?limit=5&skip=10
//GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if(req.query.completed) { //searches in url's query that comes after '?'
        //even if someone gives query as true, what we get back is not a boolean, it is a string 'true.So convert it into a boolean value
        match.completed = (req.query.completed === 'true')
    }

    if(req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = (parts[1] === 'desc' ? -1 : 1)
    }

    try {
        //const tasks = await Task.find({ owner: req.user._id })
        await req.user.populate({ //populate allows us to populate data from a relationship such as entire tasks of owner
            path: 'tasks',//we need to let it know we're trying to populate the tasks. If we provide an object it expects that property name to be set on the following path.
            match: match,
            options: {
                limit: parseInt(req.query.limit), //parse a string that contains number to an actual integer
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate() 

        console.log(req.user)
        res.send(req.user.tasks)
    }
    catch(e) {
        res.status(500).send()
    }
})

//to read single task by id
router.get('/tasks/:id', auth, async (req, res) => { 
    const _id = req.params.id

    try {
        //const task = await Task.findById(_id)
        const task = await Task.findOne({ _id, owner: req.user._id}) //now I'll only be able to get the details of a task if I'm logged in and the task I'm fetching is a task I've created(2nd condition is checked becoz sometimes there exists a tasks created by other user but u have created it) 
        if(!task)
            return res.status(404).send()

        res.send(task)
    }
    catch(e) {
        res.status(500).send()
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    
    const isValidUpdate = updates.every((update) => {
        return allowedUpdates.includes(update)
    })

    if(!isValidUpdate)
    return res.status(400).send({error: 'Invalid updates!!'})

    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })
        if(!task)
            return res.status(404).send()
        
        updates.forEach((update) => {
            task[update] = req.body[update]
        })

        await task.save()    
        res.send(task)
    }
    catch(e) {
        res.status(400).send(e)
    }
})

//to delete task
router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })
        if(!task)
            res.status(404).send()

        res.send(task)
    }
    catch(e) {
        res.status(500).send(e)
    }
})

module.exports = router