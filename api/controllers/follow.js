'use strict'

const mongoosePaginate = require('mongoose-pagination')
const Follow = require('../models/follow')
const User = require('../models/user')

function saveFollow(req, res){
  let params = req.body
  let follow = new Follow()
  follow.user = req.user.sub
  let seguido = params.followed
  follow.followed = seguido


if (seguido) {
  if (req.user.sub == params.followed) return res.status(500).send({message: 'no te puedes seguir a ti mismo'})

  Follow.findOne({followed : seguido}, (err, seguidos)=>{
    if (err) return res.status(500).send({message: 'error buscando aver si ya lo seguiste'})

    if (seguidos) return res.status(401).send({message: 'ya has seguido este usuario'})

      if (!seguidos) {
        follow.save((err, followStored)=>{
          if (err) return res.status(500).send({message: 'error al guardar el seguimiento'})

          if (!followStored) return res.status(404).send({message: 'el seguimiento no se ha guardado'})

          return res.status(200).send({follow: followStored})
        })
      }
  })
} else {
  res.status(404).send({message: 'no has mandado el id del user que quieres seguir'})
}
}

function deleteFollow(req, res){
  let userId = req.user.sub
  let followId = req.params.id

  Follow.find({'user':userId, 'followed': followId}).remove(err =>{
    if (err) res.status(500).send({message: 'error al dejar de seguir'})

    return res.status(200).send({message: 'El follow se ha eliminado'})
  })
}

function getFollowingUsers(req, res) {
  let userId = req.user.sub
  if (req.params.id && req.params.page) {
    userId = req.params.id
  }

  let page = 1
  if (req.params.page) {
    page = req.params.page
  }

  let itemsPerPage = 4

  Follow.find({user:userId}).populate({path: 'followed'}).paginate(page, itemsPerPage, (err, follows, total)=>{
    if (err) return res.status(500).send({message: 'error en la peticion'})

    if (!follows) return res.status(404).send({message: 'no estas siguiendo a ningun usuario'})

    return res.status(200).send({
      total,
      pages: Math.ceil(total/itemsPerPage),
      follows
    })

  })
}

function getFollowedUsers(req, res){
  let userId = req.user.sub

  if (req.params.id && req.params.page) {
    userId = req.params.id
  }

  let page = 1

  if (req.params.page) {
    page = req.params.page
  }
  let itemsPerPage = 4

  Follow.find({followed:userId}).populate('user').paginate(page, itemsPerPage, (err, follows, total)=>{
    if (err) return res.status(500).send({message: 'error en la peticion'})

    if (!follows) return res.status(404).send({message: 'no te sigue ningun usuario'})

    return res.status(200).send({
      total,
      pages: Math.ceil(total/itemsPerPage),
      follows
    })

  })
}
// devolver listado de usuarios
function getMyFollows(req, res){
  let userId = req.user.sub
  let query = Follow.find({user: userId})

  if (req.params.followed) {
    query = Follow.find({followed: userId})
  }

  query.populate('user followed').exec((err, follows)=>{
    if (err) return res.status(500).send({message: 'error en la peticion'})

    if (!follows) return res.status(404).send({message: 'no sigues a ningun usuario'})

    return res.status(200).send({follows})
  })
}

module.exports = {
  saveFollow,
  deleteFollow,
  getFollowingUsers,
  getFollowedUsers,
  getMyFollows
}
