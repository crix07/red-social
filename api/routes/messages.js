'use strict'

const express = require('express');
const router = express.Router()
const MessagesController = require('../controllers/messages')
const md_auth = require('../middlewares/authenticated')

router.post('/messages', md_auth.ensureAuth, MessagesController.saveMessage)
router.get('/my-messages/:page?', md_auth.ensureAuth, MessagesController.getReceivedMessages)
router.get('/messages/:page?', md_auth.ensureAuth, MessagesController.getEmmitMessages)
router.get('/unvieweds', md_auth.ensureAuth, MessagesController.getUnViewed)
router.get('/set-viewed-messages', md_auth.ensureAuth, MessagesController.setViewedMessages)
module.exports = router
