'use strict'

const express = require('express');
const router = express.Router()
const followController = require('../controllers/follow')
const md_auth = require('../middlewares/authenticated')


router.post('/follow', md_auth.ensureAuth, followController.saveFollow)
router.delete('/follow/:id', md_auth.ensureAuth, followController.deleteFollow)
router.get('/following/:id?/:page?', md_auth.ensureAuth, followController.getFollowingUsers)
router.get('/followed/:id?/:page?', md_auth.ensureAuth, followController.getFollowedUsers)
router.get('/get-my-follows/:followed?', md_auth.ensureAuth, followController.getMyFollows)
module.exports = router
