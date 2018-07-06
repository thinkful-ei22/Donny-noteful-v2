'use strict';

const express = require('express');
// Create an router instance (aka "mini-app")
const router = express.Router();

const knex = require('../knex');
/* GET ALL TAGS */

router.get('/', (req, res, next) => {
  knex.select('id', 'name')
    .from('tags')
    .then(results => {
      res.json(results);
    })
    .catch(err => next(err));
});

/* ========== POST/CREATE TAGS ========== */
router.post('/', (req, res, next) => {
  const { name } = req.body;
  
  /***** Never trust users. Validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }
  
  const newItem = { name };
  
  knex.insert(newItem)
    .into('tags')
    .returning(['id', 'name'])
    .then((results) => {
      // Uses Array index solution to get first item in results array
      const result = results[0];
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => next(err));
});

/*====UPDATE TAGS*====*/




//EXPORT MODULE
module.exports = router;