const express = require('express');
const router = express.Router();
const { getAllSkills, getCategories, getFeaturedSkills } = require('../controllers/skillController');

router.get('/', getAllSkills);
router.get('/categories', getCategories);
router.get('/featured', getFeaturedSkills);

module.exports = router;
