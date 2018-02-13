'use strict'

const moment = require('moment');
const mongoosePaginate = require('mongoose-pagination')

const User = require('../models/user')
const Message = require('../models/message')
const Follow = require('../models/follow')


function saveMessage(req, res){
  let params = req.body

  if (!params.text || !params.receiver) return res.status(200).send({message: 'Tienes que mandar los datos necesarios'})
  if (req.user.sub == req.body.receiver) return res.status(500).send({message: 'No te puedes enviar mensajes a ti mismo'})
  let message = new Message()
  message.emitter = req.user.sub
  message.receiver = params.receiver
  message.text = params.text
  message.create_at = moment().unix()
  message.viewed = 'false'

  message.save((err, messageStored)=> {
    if (err) return res.status(500).send({message: 'Error al enviar el mensaje'})
    if (!messageStored) return res.status(403).send({message: 'no se ha guardado el mensaje'})


    return res.status(200).send({messageStored})
  })
}

function getReceivedMessages(req, res){
  let userId = req.user.sub

  let page = 1
  if (req.params.page) {
    page = req.params.page
  }
  let itemsPerPage = 5

  Message.find({receiver:userId}).populate('emitter', 'nick name surname image _id ').paginate(page, itemsPerPage, (err, messages, total)=>{
    if (err) return res.status(500).send({message: 'error en la peticion'})
    if (!messages) return res.status(404).send({message: 'No hay Mensajes'})
    return res.status(200).send({
      total,
      pages: Math.ceil(total/itemsPerPage),
      messages
    })
  })
}

function getEmmitMessages(req, res){
  let userId = req.user.sub

  let page = 1
  if (req.params.page) {
    page = req.params.page
  }
  let itemsPerPage = 5

  Message.find({emitter:userId}).populate('emitter receiver', 'nick name surname image _id ').paginate(page, itemsPerPage, (err, messages, total)=>{
    if (err) return res.status(500).send({message: 'error en la peticion'})
    if (!messages) return res.status(404).send({message: 'No hay Mensajes'})
    return res.status(200).send({
      total,
      pages: Math.ceil(total/itemsPerPage),
      messages
    })
  })
}

function getUnViewed(req, res){
  let userId = req.user.sub

  Message.count({receiver: userId, viewed: 'false'}).exec((err, count)=>{
    if (err) return res.status(500).send({message: 'Error en la peticion'})
    return res.status(200).send({
      unviewd:count
    })
  })
}

function setViewedMessages(req, res){
  let userId = req.user.sub

  Message.update({receiver:userId, viewed:'false'}, {viewed:'true'}, {"multi":true}, (err, messagesUpdate)=>{
    if (err) return res.status(500).send({message: 'Error en la peticion'})
    return res.status(200).send({messages: messagesUpdate})

  })

}


module.exports = {
  saveMessage,
  getReceivedMessages,
  getEmmitMessages,
  getUnViewed,
  setViewedMessages
}
