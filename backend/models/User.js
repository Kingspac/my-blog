class User {
// Define schema (like Mongoose)
static schema = {
name: { type: 'string', required: true, minLength: 2, maxLength: 50 },
email: { type: 'string', required: true, unique: true },
age: { type: 'number', min: 0, max: 150, required: false },
phone: { type: 'string', required: false },
createdAt: { type: 'date', default: () => new Date() },
updatedAt: { type: 'date', default: () => new Date() }
};
}
module.exports = User;