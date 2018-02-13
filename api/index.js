'use strict'

const app = require('./app');
const mongoose = require('mongoose');
const config = require('./config');

mongoose.Promise = global.Promise
mongoose.connect(config.dbURL,  {useMongoClient: true})
    .then(() => {
      console.log('conexion a la base de datos realizada')
      app.listen(config.port, ()=>{
        console.log(`server corriendo en el puerto ${config.port}`)
      })
    })
    .catch((err)=> console.log(`hubo un error al conectarse a la base de datos y al server ${err}`))
