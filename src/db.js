const { db } = require('./config');

/**
 * Create all necessary tables.
 *
 * @return {Promise<void>}
 */
module.exports.setupDB = async function () {
  // TODO: move the specifics to a models file.
  await db.schema.createTable('profiles', (table) => {
    table.string('secret_key').primary();
    table.string('wallet', 1023);
    table.string('uploader_config', 1023);
  });
};

/**
 * Bring the database to the initial empty state.
 *
 * @return {Promise<void>}
 */
module.exports.resetDB = async function () {
  await db.schema.dropTableIfExists('profiles');
  await setupDB();
};
