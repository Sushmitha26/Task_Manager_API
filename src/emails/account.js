const sgMail = require('@sendgrid/mail')

//to let know sg module that we want to work on this API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

//when we send an email, sendgrid will know it's associated with our account and down below we do that using sgMail.send
//This allows us to send an individual email and we pass to it an object.
const sendWelcomeMail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'sushmithacg.20@gmail.com',
        subject: 'Welcome to the Task Manager App!!',
        html: `<h1>Hello ${name},</h1> Thanks for joining task manager app.You can manage your tasks efficiently with this app. Get started!!`,
        //text: `Thanks for joining task manager app ${name}.You can manage your tasks efficiently with this app. Get started!!`
    })
}

const sendCancellationMail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'sushmithacg.20@gmail.com',
        subject: 'Sorry to see u go!',
        text: `Goodbye ${name}, Hope to see to back again after some time`
    })
}

module.exports = {
    sendWelcomeMail,
    sendCancellationMail
}