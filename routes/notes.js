'use strict';

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();

const knex = require('../knex');

const hydrateNotes = require('../utils/hydrateNotes');

// Get All (and search by query)
router.get('/', (req, res, next) => {
  const { searchTerm } = req.query;
  const  { folderId } = req.query;
  const {tagId} = req.query;

  console.log(folderId);

  knex.select('notes.id', 'title', 'content', 'folders.id as folderId', 'folders.name as folderName','tags.id as tagId','tags.name as tagName')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags','notes.id','notes_tags.note_id')
    .leftJoin('tags','notes_tags.tag_id','tags.id')
    .modify(function (queryBuilder) {
      if (searchTerm) {
        queryBuilder.where('title', 'like', `%${searchTerm}%`);
      }
    })
    .modify(function (queryBuilder) {
      if (folderId) {
        queryBuilder.where('notes.folder_id', folderId);
      }
    })
    .modify(function (queryBuilder){
      if(tagId){
        queryBuilder.where('notes_tags.tag_id', tagId);
      }
    })
    .orderBy('notes.id')
    .then(result => {
      if (result) {
        const hydrated = hydrateNotes(result);
        res.json(hydrated);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});




// Get a single item
router.get('/:id', (req, res, next) => {
  const {id} = req.params;

  knex.select('notes.id', 'title', 'content', 'folders.id as folderId', 'folders.name as folderName','tags.id as tagId','tags.name as tagName')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags','notes.id','notes_tags.note_id')
    .leftJoin('tags','notes_tags.tag_id','tags.id')
    .where('notes.id',id)
    .then(result => {
      if (result) {
        const hydrated = hydrateNotes(result);
        res.json(hydrated);
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
  const {tags} = req.body;

  let updateObj = {
    title: req.body.title,
    content: req.body.content,
    folder_id: req.body.folderId,  // Add `folderId`

  };
  //console.log(tags);
  //console.log(updateObj);

  /***** Never trust users - validate input *****/
  if (!updateObj.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  knex('notes')
    .where('notes.id',id)
    .update(updateObj)
    .returning(['notes.id','title','content','folder_id as folderId'])
    .then(() => {
      return knex.from('notes_tags').where('notes_tags.note_id', id).del();
    })
    .then(() => {
      // Insert related tags into notes_tags table
      const tagsInsert = tags.map(tagId => ({ note_id:id, tag_id: tagId }));
      console.log(tagsInsert[0].tag_id + 'TAGS INSERT');
      return knex.insert(tagsInsert).into('notes_tags');
    })

    .then(() => {
      console.log('working?');
      //FINALLY WORKING LOL!!
      return knex.select('notes.id', 'title', 'content',
        'folders.id as folder_id', 'folders.name as folderName',
        'tags.id as tagId', 'tags.name as tagName')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
        .where('notes.id', id);
    })
    .then(result => {
      if (result) {
        // Hydrate the results
        const hydrated = hydrateNotes(result)[0];
        // Respond with a location header, a 201 status and a note object
        res.location(`${req.originalUrl}/${hydrated.id}`).status(201).json(hydrated);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

// CREATE / Post (insert) an item
router.post('/', (req, res, next) => {
  const { title, content, folderId,tags } = req.body; // Add `folderId` to object destructure

  console.log(tags);
  const newItem = {
    title: title,
    content: content,
    folder_id: folderId,  // Add `folderId`
  };

  let noteId;

  /***** Never trust users - validate input *****/
  if (!newItem.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }



  // Insert new note into notes table
  knex.insert(newItem).into('notes').returning('id')
    .then(([id]) => {
    // Insert related tags into notes_tags table
      noteId = id;
      const tagsInsert = tags.map(tagId => ({ note_id: noteId, tag_id: tagId }));
      return knex.insert(tagsInsert).into('notes_tags');
    })
    .then(() => {
    // Select the new note and leftJoin on folders and tags
      return knex.select('notes.id', 'title', 'content',
        'folders.id as folder_id', 'folders.name as folderName',
        'tags.id as tagId', 'tags.name as tagName')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
        .where('notes.id', noteId);
    })
    .then(result => {
      if (result) {
      // Hydrate the results
        const hydrated = hydrateNotes(result)[0];
        // Respond with a location header, a 201 status and a note object
        res.location(`${req.originalUrl}/${hydrated.id}`).status(201).json(hydrated);
      } else {
        next();
      }
    })
  
    .catch(err => next(err));



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
