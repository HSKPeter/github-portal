const mysql = require("mysql2/promise");
const fs = require("fs");

async function initDB(port) {
  const connection = await mysql.createConnection({
    host: "my-sql",
    user: "root",
    password: "secret",
    multipleStatements: true
  });
  connection.connect();

  const createDBAndTables = `
        CREATE DATABASE IF NOT EXISTS github_portal;
        use github_portal;

        CREATE TABLE IF NOT EXISTS users (
        ID int NOT NULL AUTO_INCREMENT,
        last_name varchar(30),
        first_name varchar(30),
        email varchar(30),
        password varchar(30),
        PRIMARY KEY (ID));

        CREATE TABLE IF NOT EXISTS github_account (
        ID int NOT NULL AUTO_INCREMENT,
        github_id int NOT NULL,            
        github_node_id varchar(255),
        username varchar(255),
        repos_url varchar(255),
        html_url varchar(255),
        PRIMARY KEY (ID));

        CREATE TABLE IF NOT EXISTS subscriptions (
        ID int NOT NULL AUTO_INCREMENT,
        user_id int NOT NULL, 
        github_following_id int NOT NULL,
        PRIMARY KEY (ID),
        FOREIGN KEY (github_following_id) REFERENCES github_account(ID),
        FOREIGN KEY (user_id) REFERENCES users(ID));
        `;
  await connection.query(createDBAndTables);

  const [rows, fields] = await connection.query("SELECT * FROM users");
  // no records? Let's add a couple - for testing purposes
  if (rows.length == 0) {
    // no records, so let's add a couple
    const userRecords = "insert into users (last_name, first_name, email, password) values ?";
    const recordValues = [
      ["Hello", "World", "user@mail.com", "Abcd1234"],
    ];
    await connection.query(userRecords, [recordValues]);

    await insertDataForDevelopmentUse();
  }


  console.log("Listening on port " + port + "!");
}

async function insertDataForDevelopmentUse(){
  const connection = await mysql.createConnection({
    host: "my-sql",
    user: "root",
    password: "secret",
    database: "github_portal",
    multipleStatements: true
  });

  connection.connect();
  await addDataToGitHubAccountTable(connection)
  await createSubscriptionRelationships(connection)  
}

async function addDataToGitHubAccountTable(connection){
  const json =fs.readFileSync(__dirname + "/githubData.json", "utf-8");
  const data = JSON.parse(json);
  for (const entry of data){
    console.log(entry);
    const {github_id, github_node_id, username, repos_url, html_url} = entry;
    const query = "INSERT INTO github_account (github_id, github_node_id, username, repos_url, html_url) values ?";
    const values = [
      [github_id, github_node_id, username, repos_url, html_url]
    ];
    await connection.query(query, [values]);
  }
}

async function createSubscriptionRelationships(connection){
  const queryForSubscription = "INSERT INTO subscriptions (user_id, github_following_id) values ?";
  for (let github_following_id = 1; github_following_id <= 4; github_following_id ++){
    const user_id = 1;
    const values = [
      [user_id, github_following_id]
    ]
    await connection.query(queryForSubscription, [values]);
  }

  for (let github_following_id = 5; github_following_id <= 6; github_following_id ++){
    const user_id = 2;
    const values = [
      [user_id, github_following_id]
    ]
    await connection.query(queryForSubscription, [values]);
  }
}

module.exports = {
  initDB,
  mysql
}