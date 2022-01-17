const mysql = require("mysql2");

function authenticate(email, password, callback) {
    const connection = mysql.createConnection({
        host: "my-sql",
        user: "root",
        password: "secret",
        database: "github_portal"
    });
    connection.connect();
    connection.query(
        "SELECT * FROM users WHERE email = ? AND password = ?", [email, password],
        function (error, results, fields) {
            if (error || results === undefined || results.length === 0){
                return callback(null);
            }

            if (results.length > 0) {
                return callback(results[0]);
            }

        }
    );
}

module.exports =  {
    authenticate
}