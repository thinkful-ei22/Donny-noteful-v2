'use strict';

const noteId = 1013;
const result = [1, 2, 3].map(tagId => ({ note_id: noteId, tag_id: tagId }));
console.log(`insert: ${result} into notes_tags`);