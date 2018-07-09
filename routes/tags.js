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


/* GET INDIVIDUAL TAGS */

router.get('/:id', (req, res, next) => {
  const {id} = req.params;
  
  knex
    .select()
    .from('tags')
    .where('id',id)
    .then(([tag]) => {  //array destructuring
      if (tag) {
        res.json(tag);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
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


/*===UPDATE TAG ====*/
router.put('/:id', (req, res, next) => {
  const id = req.params.id;

  const updateObj={};
  const updateableFields=['name'];

  updateableFields.forEach(field => {
    if(field in req.body){
      updateObj[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!updateObj.name) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }


  knex()
    .from('tags')
    .where({id})
    .update(updateObj)
    .returning(['id','name'])
    .then(results => {
      res.json(results[0]);
    })
    .catch(err => {
      next(err);
    });

});






/*====DELETE TAGS*====*/

//DELETE A FOLDER BY ID

// Delete an folder
router.delete('/:id', (req, res, next) => {
  const {id} = req.params;
  
  knex('tags')
    .where('id',id)
    .del()
    .then( () => res.sendStatus(204))
    .catch(err => next(err));
  
});
  




//EXPORT MODULE
module.exports = router;