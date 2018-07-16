const Profile = require('./models/profile');

/**
 * Create all necessary tables.
 *
 * @return {Promise<void>}
 */
async function setupDB () {
  await Profile.createTable();
}

/**
 * Bring the database to the initial empty state.
 *
 * @return {Promise<void>}
 */
async function resetDB () {
  await Profile.dropTable();
  await setupDB();
}

module.exports = {
  setupDB,
  resetDB,
};
