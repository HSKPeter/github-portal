const mysql = require("mysql2/promise");

async function dropDB() {
    const connection = await mysql.createConnection({
      host: "my-sql",
      user: "root",
      password: "secret",
      multipleStatements: true
    });
    connection.connect();
    
    const createDBAndTables = "DROP DATABASE github_portal;";
    await connection.query(createDBAndTables);
    return;
}

dropDB().then(() => console.log("Database dropped!"));