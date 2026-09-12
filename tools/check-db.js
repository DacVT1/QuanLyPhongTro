const Database = require("better-sqlite3");
const db = new Database("D:\\QuanLyNhaTro\\backend\\database.sqlite");
console.log(
  "TABLES",
  JSON.stringify(
    db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
      )
      .all(),
    null,
    2,
  ),
);
db.close();
