// Runs once, when the database volume is first created (docker-entrypoint-initdb.d).
// The API and backups use this user: read/write on the app database only, not root.
const dbName = process.env.MONGO_DB || "masar";
db.getSiblingDB(dbName).createUser({
  user: process.env.MONGO_APP_USER,
  pwd: process.env.MONGO_APP_PASSWORD,
  roles: [{ role: "readWrite", db: dbName }],
});
