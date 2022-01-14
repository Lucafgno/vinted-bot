const { createConnection } = require("typeorm");
const { config } = require("dotenv");
config();

createConnection({
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
}).then(async (connection) => {
  connection.query("CREATE DATABASE vinted_bot").catch(() => {
    console.log("--> Postgres: Database already exists");
  });
});
