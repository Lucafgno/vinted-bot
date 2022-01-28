const { createConnection } = require("typeorm");
const { config } = require("dotenv");
config();

createConnection({
  type: "postgres",
  // url: process.env.DATABASE_URl,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  ssl: true,
  extra: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
}).then(async (connection) => {
  connection.query("CREATE DATABASE vinted_bot").catch((e) => {
    console.log(e, "--> Postgres: Database already exists");
  });
});
