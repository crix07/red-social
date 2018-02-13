'use strict'

const express = require('express');
const router = express.Router()
const UserController = require('../controllers/user')
const multiPart = require('connect-multiparty')

const md_auth = require('../middlewares/authenticated')
const md_upload = multiPart({uploadDir: './uploads/users'})

router.get('/', md_auth.ensureAuth, UserController.Home)
router.post('/register', UserController.saveUser)
router.post('/login', UserController.loginUser)
router.get('/user/:id', md_auth.ensureAuth, UserController.getUser)
router.get('/users/:page?', md_auth.ensureAuth, UserController.getUsers)
router.get('/counters/:id?', md_auth.ensureAuth, UserController.getCounters)
router.put('/update-user/:id', md_auth.ensureAuth, UserController.updateUser)
router.post('/upload-image-user/:id', [md_auth.ensureAuth, md_upload], UserController.uploadImage)
router.get('/get-image-user/:imageFile', UserController.getImagefile)

module.exports = router
