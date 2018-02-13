'use strict'

const express = require('express');
const app = express()
const bodyParser = require('body-parser');
const morgan = require('morgan');
// cargar rutas
const routes = require('./routes/user')
const followRoutes = require('./routes/follow')
const PublicRoutes = require('./routes/publication')
const MessagesRoutes = require('./routes/messages')
// Middlewares
app.use(morgan('dev'))
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())



// cors
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');

    next();
});



// routes
app.use('/api', routes)
app.use('/api', followRoutes)
app.use('/api', PublicRoutes)
app.use('/api', MessagesRoutes)

module.exports = app
