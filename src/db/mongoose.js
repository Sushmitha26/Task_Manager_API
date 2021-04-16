const mongoose = require('mongoose') //mongoose uses mongodb module behind the scenes
const validator = require('validator')

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true //This is going to make sure that when Mongoose works with Mongo D.B, our indexes are created allowing us to quickly access the data we need to access.
})


