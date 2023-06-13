const express = require('express');
require('./db/mongoose'); // Require the mongoose file, to ensure the file runs, and ensures mongoose connects to DB

const userRouter = require('./routers/user'); // The user router
const taskRouter = require('./routers/task'); // The task router

const app = express(); // Creating new express aplication
const port = process.env.PORT //PORT is from heroku

// Maintanence shutdown
// app.use((req, res, next) => {
//   res.status(503).send('Site is currently down, please check back soon!');
// })

app.use(express.json()) // Express parse the incoming JSON from the http request so it's excessible as an object
app.use(userRouter); // Register the user router with our excisting app
app.use(taskRouter); // Register the task router with our excisting app

app.listen(port , () => {
  console.log(`Server is up on ${port}`);
})
