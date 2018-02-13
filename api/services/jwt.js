'use strict'

const jwt = require('jwt-simple')
const moment = require('moment');
const config = require('../config')
exports.createToken = function(user){
  let payload = {
    sub: user._id,
    name: user.name,
    nick: user.nick,
    surname: user.surname,
    email: user.email,
    role: user.role,
    image: user.image,
    iat: moment.unix(),
    exp: moment().add(30, 'days').unix()
  }

  return jwt.encode(payload, config.secret)
}
