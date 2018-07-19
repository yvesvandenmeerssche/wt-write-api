const Account = require('./models/account');

/**
 * Create all necessary tables.
 *
 * @return {Promise<void>}
 */
async function setupDB () {
  await Account.createTable();
}

/**
 * Bring the database to the initial empty state.
 *
 * @return {Promise<void>}
 */
async function resetDB () {
  await Account.dropTable();
  await setupDB();
}

module.exports = {
  setupDB,
  resetDB,
};
