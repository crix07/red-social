'use strict'

const bcrypt = require('bcrypt-nodejs')
const User = require('../models/user')
const Follow = require('../models/follow')
const Publication = require('../models/publications')
const jwt = require('../services/jwt')
const fs = require('fs');
const path = require('path');
const mongoosePaginate = require('mongoose-pagination')

function Home(req, res){
  res.status(200).send({message: 'hello world desde NodeJS'})
}


function getCounters(req, res){
  let userId = req.user.sub
  if (req.params.id) {
    userId = req.params.id
  }
  if (userId === null || userId === undefined) {
    return res.status(500).send({message: 'Tienes que enviar un ID'})
  }

  getCountFollow(userId).then((value)=>{
    return res.status(200).send(value)
  })
}

async function getCountFollow(user_id){
  var following = await Follow.count({'user':user_id}).exec((err, count)=>{
    if (err) handleError(err)
    return count
  })

  var followed = await Follow.count({'followed':user_id}).exec((err, count)=>{
    if (err) handleError(err)
    return count
  })

  let publications = await Publication.count({'user':user_id}).exec((err, count)=>{
    if (err) return handleError(err)
    return count
  })

  return {
    following: following,
    followed: followed,
    publications: publications
  }
}


function updateUser(req, res){
  let userId = req.params.id
  let update = req.body

  delete update.password

  if (userId != req.user.sub) {
    return res.status(500).send({message: 'no tienes permisos para actualizar el usuario'})
  }
  User.findByIdAndUpdate(userId, update,{ new: true }, (err, userUpdated)=>{
    if (err) return res.status(500).send({message: 'error en la peticion'})
    if (!userUpdated) return res.status(404).send({message: 'no se ha podido actuazlizar el usuario'})

    return res.status(200).send({user: userUpdated})

  })

}

function loginUser(req, res){
  let params = req.body
  let email = params.email
  let password = params.password
  User.findOne({email: email}, (err, user)=>{
    if (err) return res.status(500).send({message: 'error en la peticion'})

    if (user) {
        bcrypt.compare(password, user.password, (err, check)=>{
          if (check) {
            if (params.gettoken) {
              // generar y devolver token
              return res.status(200).send({
                  token: jwt.createToken(user)
              })
            } else {
              user.password = undefined
              return res.status(200).send({user})
            }
          } else {
            res.status(500).send({message: 'el usuario no se ha podido identificar'})
          }
        })
    } else {
      res.status(500).send({message: 'el usuario no existe'})
    }
  })
}

function saveUser(req, res){
  let params = req.body
  let user = new User()
  if (params.email && params.surname && params.nick && params.password && params.name) {
    User.find({$or: [
      {email: params.email.toLowerCase()},
      {nick: params.nick.toLowerCase()}
    ]} ,(err, users)=>{
      if (err) return res.status(500).send({message: 'error al buscar el email en la DB'})

      if (users && users.length >= 1) {
        users.map(user => {
          console.log(user.email)
          res.status(403).send({message: `ya existe el usuario por favor iniciar sesion como ${user.email}`})
        })
      } else {
        user.email = params.email
        user.surname = params.surname
        user.nick = params.nick
        user.name = params.name
        user.role = 'ROLE_USER'
        user.image = null
        bcrypt.hash(params.password, null, null, (err, hash)=>{
          user.password = hash

          user.save((err, userStored)=>{
            if (err) return res.status(500).send({message: 'error al guardar el usuario'})
            if (userStored) {
              userStored.password = undefined
              res.status(200).send({userStored})
            } else {
              res.status(500).send({message: 'no se ha registrado el usuario'})
            }
          })

        })
      }
    })
  } else {
    res.status(500).send({ message: 'Por favor llena todos los campos vacios'})
  }

}

function getUser(req, res){
  let userId = req.params.id

  User.findById(userId, (err, user)=>{
    if (err) return res.status(500).send({message: 'error en la busqueda del usuario'})

    if (!user ) return res.status(404).send({message: 'no se encontro el usuario que buscas'})

    followThisUser(req.user.sub, userId).then((value)=>{
      user.password = undefined
      return res.status(200).send({
        user,
        following: value.following,
        followed: value.followed
       })
    })



  })
}

async function followThisUser(identity_user_id, user_id){
  let following = await Follow.findOne({"user":identity_user_id, "followed":user_id}).exec((err, follow) => {
      if (err) handleError(err)
      return follow
    })

  let followed = await Follow.findOne({"user":user_id, "followed":identity_user_id}).exec((err, follow) => {
      if (err) handleError(err)
      return follow
    })

    return {
      following: following,
      followed: followed
    }
}


function getUsers(req, res){
  let identity_id = req.user.sub
  let page = 1
  if (req.params.page) {
      page = req.params.page
  }
  var itemsPerPage = 5

  User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total)=>{
    if (err) return res.status(500).send({message: 'error en la busqueda del usuario'})

    if (!users) return res.status(404).send({message: 'no hay resultados disponibles'})
    followUserIds(identity_id).then((value)=>{
      return res.status(200).send({
        users,
        users_following: value.following,
        users_follow_me: value.followed,
        total,
        pages: Math.ceil(total/itemsPerPage)
      })
    })
  })
}

async function followUserIds(user_id){
  let following = await Follow.find({"user":user_id}).select({'_id':0, '__v':0, 'user':0}).exec((err, follows)=>{
      return follows
  })

  let followed = await Follow.find({"followed":user_id}).select({'_id':0, '__v':0, 'followed':0}).exec((err, follows)=>{
    return follows
  })

//  procesar following ids
    let following_clean = []

    following.forEach((follow)=>{
      following_clean.push(follow.followed)
    })
// procesar followed ids
      let followed_clean = []

      followed.forEach((follow)=>{
        followed_clean.push(follow.user)
      })


  return {
    following: following_clean,
    followed: followed_clean
  }
}


function uploadImage(req, res){
  let userId = req.params.id


  if (req.files) {
    let file_path = req.files.image.path
    let file_split = file_path.split('\\')
    let file_name = file_split[2]
    let ext_split = file_name.split('\.')
    let file_ext = ext_split[1]
    console.log(ext_split)

    if (userId != req.user.sub) {
      return  removeFilesofUploads(res, file_path, 'no tienes permisos para actualizar los datos del usuario')
    }



    if (file_ext == 'png' || file_ext == 'jpeg' || file_ext == 'jpg' || file_ext == 'gif') {

      User.findByIdAndUpdate(userId, {image: file_name}, { new:true }, (err, userStored)=>{
        if (err) return res.status(500).send({message: 'Error en la peticion'})

        if (!userStored) {
          return removeFilesofUploads(res, file_path, 'no se ha podido actualizar el usuario')
        }
        return res.status(200).send({user: userStored})
      })

    } else {
      return removeFilesofUploads(res ,file_path, 'Extension no valida')
    }

  } else {
    return res.status(200).send({message: 'no se ha subido ninguna imagenes'})
  }

}

function removeFilesofUploads(res, file_path, message){
  fs.unlink(file_path, (err)=>{
    res.status(403).send({message: message})
  })
}


function getImagefile(req, res){
  let image_file = req.params.imageFile
  let path_file = './uploads/users/'+image_file

  fs.exists(path_file, (exists)=>{
    if (exists) {
      res.sendFile(path.resolve(path_file))
    } else {
      res.status(200).send({message: 'no existe la imagen'})
    }
  })

}


module.exports = {
  Home,
  saveUser,
  getUser,
  loginUser,
  getUsers,
  getCounters,
  updateUser,
  uploadImage,
  getImagefile
}
