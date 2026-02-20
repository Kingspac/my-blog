const Datastore = require('nedb');
const path = require('path');
const db = {
users: new Datastore({
filename: path.join(__dirname, '../data/users.db'),
autoload: true
}),
posts: new Datastore({
filename: path.join(__dirname, '../data/posts.db'),
autoload: true

})
};
// Add unique index on email
db.users.ensureIndex({ fieldName: 'email', unique: true });
console.log('NeDB databases loaded');
module.exports = db;