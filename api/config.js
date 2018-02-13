'use strict'

module.exports = {
  dbURL: process.env.MONGO_URI || 'mongodb://localhost:27017/mean_social',
  port: process.env.PORT || 3000,
  secret: 'negrito-geekdroid'
}
