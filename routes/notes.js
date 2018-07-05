'use strict';

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();

const knex = require('../knex');

// Get All (and search by query)
router.get('/', (req, res, next) => {
  const { searchTerm } = req.query;
  const  { folderId } = req.query;

  knex.select('notes.id', 'title', 'content', 'folders.id as folderId', 'folders.name as folderName')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .modify(function (queryBuilder) {
      if (searchTerm) {
        queryBuilder.where('title', 'like', `%${searchTerm}%`);
      }
    })
    .modify(function (queryBuilder) {
      if (folderId) {
        queryBuilder.where('folder_id', folderId);
      }
    })
    .orderBy('notes.id')
    .then(results => {
      res.json(results);
    })
    .catch(err => next(err));
});

// Get a single item
router.get('/:id', (req, res, next) => {
  const {id} = req.params;

  knex.select('notes.id', 'title', 'content', 'folders.id as folderId', 'folders.name as folderName')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .where('notes.id',id)
    .then(([note]) => {  //array destructuring
      if (note) {
        res.json(note);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

// Put update an item
router.put('/:id', (req, res, next) => {
  const {id} = req.params;

  /***** Never trust users - validate input *****/
  const updateObj = {};
  const updateableFields = ['title', 'content'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!updateObj.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  knex('notes')
    .where('notes.id',id)
    .update(updateObj)
    .then(item => {
      if (item) {
        res.json(item);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });


   

  // notes.update(id, updateObj)
  //   .then(item => {
  //     if (item) {
  //       res.json(item);
  //     } else {
  //       next();
  //     }
  //   })
  //   .catch(err => {
  //     next(err);
  //   });
});

// CREATE / Post (insert) an item
router.post('/', (req, res, next) => {
  const { title, content, folderId } = req.body; // Add `folderId` to object destructure

  const newNote = { title, content };
  /***** Never trust users - validate input *****/
  if (!newNote.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  knex('notes')
    .insert(newNote)
    .returning(['id', 'title', 'content'])
    .then(([note]) => {
      if (note) {
        res.location(`http://${req.headers.host}/notes/${note.id}`).status(201).json(note);
      }
    })
    .catch(err => {
      next(err);
    });
});




// Delete an item
router.delete('/:id', (req, res, next) => {
  const {id} = req.params;

  knex('notes')
    .where('id',id)
    .del()
    .then( () => res.sendStatus(204))
    .catch(err => next(err));

  // notes.delete(id)
  //   .then(() => {
  //     res.sendStatus(204);
  //   })
  //   .catch(err => {
  //     next(err);
  //   });
});

module.exports = router;
