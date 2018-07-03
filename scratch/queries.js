'use strict';

const knex = require('../knex');



//Get all notes that match a search term
let searchTerm = 'cat';
knex
  .select('notes.id', 'title', 'content')
  .from('notes')
  .modify(queryBuilder => {
    if (searchTerm) {
      queryBuilder.where('title', 'like', `%${searchTerm}%`);
    }
  })
  .orderBy('notes.id')
  .then(results => {
    console.log(JSON.stringify(results, null, 2));
  })
  .catch(err => {
    console.error(err);
  });

//Get a note by ID - accepts ID and returns the note as an object
let searchId = 1003;

knex
  .select('notes.id','title','content')
  .from('notes')
  .where('id',`${searchId}`)
  .then( ([item]) => {
    console.log(item);
  });

//Update Note By Id accepts an ID and an object with the desired updates. 
//It returns the updated note as an object

let updateId = 1005;
let updatedNote = {title:'Mr Pants Feels Good All Over',content:'Very nice trousers!'};

knex('notes')
  .where('notes.id',`${updateId}`)
  .update(updatedNote)
  .returning(['id', 'title', 'content'])
   .then(([results]) => {
     console.log(results);
   })
   .catch(err => {
     console.error(err);
   });


