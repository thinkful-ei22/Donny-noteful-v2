'use strict';

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();

const knex = require('../knex');

//GET ALL FOLDERS
router.get('/', (req, res, next) => {
  knex.select('id', 'name')
    .from('folders')
    .then(results => {
      res.json(results);
    })
    .catch(err => next(err));
});

// GET FOLDER BY ID
router.get('/:id', (req, res, next) => {
  const {id} = req.params;

  knex
    .select()
    .from('folders')
    .where('id',id)
    .then(([folder]) => {  //array destructuring
      if (folder) {
        res.json(folder);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});


//UPDATE FOLDER
// Put update an item





// CREATE / Post (insert) a FOLDER
router.post('/', (req, res, next) => {
  const { name } = req.body;

  const newFolder = { name };
  /***** Never trust users - validate input *****/
  if (!newFolder.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  knex('folders')
    .insert(newFolder)
    .returning(['id', 'name'])
    .then(([folder]) => {
      if (folder) {
        res.location(`http://${req.headers.host}/folders/${folder.id}`).status(201).json(folder);
      }
    })
    .catch(err => {
      next(err);
    });
});




//DELETE A FOLDER BY ID

// Delete an folder
router.delete('/:id', (req, res, next) => {
  const {id} = req.params;

  knex('folders')
    .where('id',id)
    .del()
    .then( () => res.sendStatus(204))
    .catch(err => next(err));

});





//EXPORT MODULE
module.exports = router;