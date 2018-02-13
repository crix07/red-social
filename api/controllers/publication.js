'use strict'

const fs = require('fs');
const path = require('path');
const moment = require('moment');
const mongoosePaginate = require('mongoose-pagination')

const Publication = require('../models/publications')
const Follow = require('../models/follow')
const User = require('../models/user')

function prueba(req, res){
  return res.status(200).send({message: 'this works!! desde Controller Publication'})
}

function savePublication(req, res){
  let params = req.body

  if (!params.text) return res.status(200).send({message: 'Debes enviar un texto'})

  let publication = new Publication()
  publication.text = params.text
  publication.file = null
  publication.user = req.user.sub
  publication.created_at = moment().unix()

  publication.save((err, publicationStored) => {
    if (err) return res.status(500).send({message: 'error al publicar'})
    if (!publicationStored) return res.status(500).send({message: 'la publication no ha sido guardada'})
    return res.status(200).send({publication: publicationStored})
  })
}

function getPublications(req, res){
  let page = 1
  if (req.params.page) {
    page = req.params.page
  }

  let itemsPerPage = 4
  Follow.find({user: req.user.sub}).populate('followed').exec((err, follows)=>{
    if (err) return res.status(500).send({message: 'Error al devolver el seguimiento'})

    let follows_clean = []

    follows.forEach((follow)=>{
      follows_clean.push(follow.followed)
    })
    Publication.find({user: {"$in": follows_clean}}).sort('-created_at').populate('user').paginate(page, itemsPerPage, (err, publications, total)=>{
      if (err) return res.status(500).send({message: 'Error al devolver publications'})
      if(!publications) return res.status(404).send({message: 'No hay publications'})

      return res.status(200).send({
        total_items: total,
        publications,
        pages: Math.ceil(total/itemsPerPage),
        page: page
      })
    })
  })
}

function getPublication(req, res){
  let publicationId = req.params.id

  Publication.findById({'_id':publicationId}).populate('user').exec((err, publication)=>{
    if (err) return res.status(500).send({message: 'Error al devolver la publicacion'})
    if (!publication) return res.status(404).send({message: 'la publicacion no se encontro'})

    return res.status(200).send({publication})
  })
}

function deletePublication(req, res){
  let publicationId = req.params.id

  Publication.find({'user': req.user.sub, '_id':publicationId}).remove(err=>{
    if (err) return res.status(500).send({message: 'Error al borrar la publication'})
    return res.status(200).send({message: 'Publicacion eliminada correctamente'})
  })
}


function uploadImage(req, res){
  let publicationId = req.params.id


  if (req.files) {
    let file_path = req.files.image.path
    let file_split = file_path.split('\\')
    let file_name = file_split[2]
    let ext_split = file_name.split('\.')
    let file_ext = ext_split[1]

    if (file_ext == 'png' || file_ext == 'jpeg' || file_ext == 'jpg' || file_ext == 'gif') {

      Publication.findOne({'user':req.user.sub, '_id':publicationId}).exec((err, publication)=>{
        if (err) return res.status(500).send({message: 'Error al comprobar que eres el de la publication'})

        if (publication) {
          Publication.findByIdAndUpdate(publicationId, {file: file_name}, { new:true }, (err, publicationStored)=>{
            if (err) return res.status(500).send({message: 'Error en la peticion'})

            if (!publicationStored) {
              return removeFilesofUploads(res, file_path, 'no se ha podido actualizar la publication')
            }
            return res.status(200).send({publication: publicationStored})
          })
        } else {
          return removeFilesofUploads(res ,file_path, 'no tienes permiso para subir archivos de esta publication')
        }
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
  let path_file = './uploads/publications/'+image_file

  fs.exists(path_file, (exists)=>{
    if (exists) {
      res.sendFile(path.resolve(path_file))
    } else {
      res.status(200).send({message: 'no existe la imagen'})
    }
  })

}




module.exports = {
  prueba,
  savePublication,
  getPublications,
  getPublication,
  deletePublication,
  uploadImage,
  getImagefile
}
