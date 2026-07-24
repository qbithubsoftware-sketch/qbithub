import EmbeddedPostgres from 'embedded-postgres';

const PG_DATA_DIR = '/home/z/my-project/.pg-data';
const PG_PORT = 54321;
const PG_USER = 'postgres';
const PG_PASSWORD = 'qbithub2024';
const PG_DATABASE = 'qbithub';

async function setup() {
  const embeddedPg = new EmbeddedPostgres({
    databaseDir: PG_DATA_DIR,
    port: PG_PORT,
    user: PG_USER,
    password: PG_PASSWORD,
    authMethod: 'password',
    persistent: true,
    createPostgresUser: false,
    onLog: (msg) => process.stdout.write(`[PG] ${msg}\n`),
    onError: (err) => process.stderr.write(`[PG ERROR] ${err}\n`),
  });

  // The database cluster is already initialized, so just start it
  console.log('Starting PostgreSQL server...');
  await embeddedPg.start();
  console.log('✅ PostgreSQL server started on port', PG_PORT);

  const connectionString = `postgres://${PG_USER}:${PG_PASSWORD}@localhost:${PG_PORT}/${PG_DATABASE}`;
  console.log('DATABASE_URL=' + connectionString);

  // Keep alive
  await new Promise(() => {});
}

setup().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
