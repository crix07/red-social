'use strict'

const express = require('express');
const router = express.Router()
const PublicationController = require('../controllers/publication')
const md_auth = require('../middlewares/authenticated')
const multiPart = require('connect-multiparty')

const md_upload = multiPart({uploadDir: './uploads/publications'})

router.get('/prueba', md_auth.ensureAuth, PublicationController.prueba)
router.post('/publication', md_auth.ensureAuth, PublicationController.savePublication)
router.get('/publications/:page?', md_auth.ensureAuth, PublicationController.getPublication)
router.get('/publication/:id', md_auth.ensureAuth, PublicationController.getPublication)
router.delete('/publication/:id', md_auth.ensureAuth, PublicationController.deletePublication)
router.post('/upload-image-pub/:id', [md_auth.ensureAuth, md_upload], PublicationController.uploadImage)
router.get('/get-image-pub/:imageFile', PublicationController.getImagefile)
module.exports = router
