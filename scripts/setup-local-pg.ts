import EmbeddedPostgres from 'embedded-postgres';

const PG_DATA_DIR = '/home/z/my-project/.pg-data';
const PG_PORT = 54321; // Use non-standard port to avoid conflicts
const PG_USER = 'postgres';
const PG_PASSWORD = 'qbithub2024';
const PG_DATABASE = 'qbithub';

async function setup() {
  console.log('🚀 Setting up embedded PostgreSQL database...');

  const embeddedPg = new EmbeddedPostgres({
    databaseDir: PG_DATA_DIR,
    port: PG_PORT,
    user: PG_USER,
    password: PG_PASSWORD,
    authMethod: 'password',
    persistent: true,
    createPostgresUser: false,
    onLog: (msg) => console.log(`[PG] ${msg}`),
    onError: (err) => console.error(`[PG ERROR] ${err}`),
  });

  // Initialize the database cluster
  console.log('Initializing PostgreSQL cluster...');
  await embeddedPg.initialise();
  console.log('✅ PostgreSQL cluster initialized.');

  // Start the database
  console.log('Starting PostgreSQL server...');
  await embeddedPg.start();
  console.log('✅ PostgreSQL server started on port', PG_PORT);

  // Create the application database
  console.log('Creating database:', PG_DATABASE);
  await embeddedPg.createDatabase(PG_DATABASE);
  console.log('✅ Database', PG_DATABASE, 'created.');

  // Print the connection string
  const connectionString = `postgres://${PG_USER}:${PG_PASSWORD}@localhost:${PG_PORT}/${PG_DATABASE}`;
  console.log('\n========================================');
  console.log('DATABASE_URL=' + connectionString);
  console.log('========================================\n');
  console.log('Add this to your .env file:');
  console.log(`DATABASE_URL=${connectionString}`);
  console.log('\nThe PostgreSQL server will keep running until this script exits.');
  console.log('Press Ctrl+C to stop the server.');

  // Keep the process running so the database stays alive
  process.on('SIGINT', async () => {
    console.log('\nStopping PostgreSQL server...');
    await embeddedPg.stop();
    console.log('✅ PostgreSQL server stopped.');
    process.exit(0);
  });

  // Also stop on SIGTERM
  process.on('SIGTERM', async () => {
    console.log('\nStopping PostgreSQL server...');
    await embeddedPg.stop();
    console.log('✅ PostgreSQL server stopped.');
    process.exit(0);
  });

  // Keep alive
  await new Promise(() => {});
}

setup().catch((err) => {
  console.error('Failed to setup PostgreSQL:', err);
  process.exit(1);
});
