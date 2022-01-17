const express = require("express");
const session = require("express-session");
const fs = require("fs");
const { JSDOM } = require('jsdom');
const { initDB, mysql } = require("./manageDatabase");
const { authenticate } = require("./authenticate");
const { isLatest } = require("./filterRepos")
const axios = require('axios');


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/js", express.static("public/js"));
app.use("/css", express.static("public/css"));
app.use("/svg", express.static("public/svg"));

app.use(session(
      {
            secret: "Ensure the web application is secure and exclusive the logged-in users",
            name: "GitHub portal created by Peter",
            resave: false,
            saveUninitialized: true
      })
);


app.get("/", function (req, res) {
      if (req.session.loggedIn) {
            res.redirect("/profile");
      } else {
            const doc = fs.readFileSync(__dirname + "/app/html/login.html", "utf8");
            res.set("Server", "Wazubi Engine");
            res.set("X-Powered-By", "Wazubi");
            res.send(doc);
      }
});

app.get("/profile", function (req, res) {
      if (req.session.loggedIn) {
            const doc = fs.readFileSync(__dirname + "/app/html/profile.html", "utf8");
            res.set("Server", "Wazubi Engine");
            res.set("X-Powered-By", "Wazubi");
            res.send(doc);
      } else {
            res.redirect("/");
      }
});

app.get("/user", async function (req, res) {
      res.setHeader("Content-Type", "application/json");
      if (req.session.loggedIn) {
            const { email, firstName, lastName } = req.session;
            res.send({ email, firstName, lastName });
      } else {
            res.send({ message: "You are not logged in." });
      }

})

app.get("/subscription", async function (req, res) {
      res.setHeader("Content-Type", "application/json");
      if (req.session.loggedIn) {
            const connection = await mysql.createConnection({
                  host: "my-sql",
                  user: "root",
                  password: "secret",
                  database: "github_portal",
                  multipleStatements: true
            });
            connection.connect();

            const [subscriptions, fields] = await connection.query("SELECT * FROM github_account JOIN subscriptions ON github_account.ID = subscriptions.github_following_id WHERE user_id = " + mysql.escape(req.session.userID));
            res.status(200).send(JSON.stringify(subscriptions));
      } else {
            res.status(400).send({ status: "fail", message: "Please log in." });
      }
})

app.post("/subscription", async function (req, res) {
      res.setHeader("Content-Type", "application/json");
      if (req.session.loggedIn) {            
            const { github_id, github_node_id, github_username, repos_url } = req.body;
            const connection = await mysql.createConnection({
                  host: "my-sql",
                  user: "root",
                  password: "secret",
                  database: "github_portal",
                  multipleStatements: true
            });
            connection.connect();

            const [rows, fields] = await connection.query('SELECT * FROM github_account WHERE github_id = ' + mysql.escape(github_id));
            const github_following_id = rows[0].ID;
            const user_id = req.session.userID;
            const query = "INSERT INTO subscriptions (user_id, github_following_id) values ?";
            const values = [
                  [user_id, github_following_id]
            ]

            await connection.query(query, [values]);
            res.send({ status: "success" });
      } else {
            res.status(400).send({ status: "fail", message: "Please log in." });
      }
})

app.post("/unsubscribe", async function (req, res) {
      res.setHeader("Content-Type", "application/json");
      if (req.session.loggedIn) {
            const { github_node_id, github_username, repos_url } = req.body;
            const github_id = parseInt(req.body.github_id)
            const connection = await mysql.createConnection({
                  host: "my-sql",
                  user: "root",
                  password: "secret",
                  database: "github_portal",
                  multipleStatements: true
            });
            connection.connect();

            await connection.query("DELETE subscriptions FROM subscriptions JOIN github_account ON subscriptions.github_following_id=github_account.ID WHERE subscriptions.user_id = " + mysql.escape(req.session.userID) + " AND github_account.github_id = " + mysql.escape(github_id));
            const [subscriptions, fields] = await connection.query("SELECT * FROM github_account JOIN subscriptions ON subscriptions.github_following_id=github_account.ID WHERE subscriptions.user_id = " + mysql.escape(req.session.userID));
            res.status(200).send(subscriptions);
      } else {
            res.status(400).send({ status: "fail", message: "Please log in." });
      }
})

app.get("/search/github/users", async function (req, res) {
      res.setHeader("Content-Type", "application/json");
      if (req.session.loggedIn) {
            const searchTerm = req.query.q;
            const responseFromGitHubApi = await axios.get(`https://api.github.com/search/users?q=${searchTerm}`);
            const searchResults = responseFromGitHubApi.data.items;

            const connection = await mysql.createConnection({
                  host: "my-sql",
                  user: "root",
                  password: "secret",
                  database: "github_portal",
                  multipleStatements: true
            });
            connection.connect();

            // Add data of GitHub accounts if they have not been recorded in the database
            const [savedAccounts, fieldsOfSavedAccounts] = await connection.query("SELECT * FROM github_account");
            const subscriptionIDs = savedAccounts.map(account => account.github_id);
            const searchResultsToBeSavedInDB = searchResults.filter(result => subscriptionIDs.includes(result.id) === false);
            for (const result of searchResultsToBeSavedInDB) {
                  const query = "INSERT INTO github_account (github_id, github_node_id, username, repos_url, html_url) values ?";
                  const values = [
                        [result.id, result.node_id, result.login, result.repos_url.split("https://api.github.com/users/")[1], result.html_url.split("https://github.com/")[1]]
                  ];
                  await connection.query(query, [values]);
            }

            // Filter search results.
            // Filter out those GitHub accounts who have been already been subscribed by the user.
            const [subscribedAccounts, fieldsOfSubscribedAccounts] = await connection.query("SELECT github_account.github_id FROM subscriptions JOIN github_account ON github_account.ID=subscriptions.github_following_id WHERE subscriptions.user_id = " + mysql.escape(req.session.userID))
            const subscribedAccountsIDs = subscribedAccounts.map(subscription => subscription.github_id);
            const filteredSearchResults = searchResults.filter(result => subscribedAccountsIDs.includes(result.id) === false)
            res.send(filteredSearchResults);
      } else {
            res.status(400).send({ status: "fail", message: "Please log in." });
      }
})

app.get("/search/github/repos", async function (req, res) {
      res.setHeader("Content-Type", "application/json");
      const errorRepo = []
      const templateData = {
            html_url: "https://docs.github.com/en/developers/apps/building-github-apps/rate-limits-for-github-apps",
            name: "Oops",
            description: "The rate limit of GitHub API is reached." ,
            owner:  {
                  avatar_url: "https://avatars.githubusercontent.com/u/9919?v=4",
                  html_url : "https://docs.github.com/en/developers",
                  login: "GitHub"
            }
      }
      let i = 0;
      while (i < 48){
            errorRepo.push(templateData)
            i ++;
      }
      
      if (req.session.loggedIn) {
            try {
                  const { day_range } = req.query;
                  const connection = await mysql.createConnection({
                        host: "my-sql",
                        user: "root",
                        password: "secret",
                        database: "github_portal",
                        multipleStatements: true
                  });
                  connection.connect();
                  
                  const [subscriptions, fields] = await connection.query("SELECT * FROM github_account JOIN subscriptions ON github_account.ID = subscriptions.github_following_id WHERE user_id = " + mysql.escape(req.session.userID));
                  const repoLinks = subscriptions.map(subscription => "https://api.github.com/users/" + subscription.repos_url);
                  const reposOfAllSubscriptions = [];
                  for (const link of repoLinks) {
                        const reposOfOneSubscription = new Promise(async (resolve, reject) => {
                              try {
                                    const responseFromGitHubApi = await axios.get(link);
                                    resolve(responseFromGitHubApi.data)
                              } catch (error){
                                    reject();
                              }
                        });
                        reposOfAllSubscriptions.push(reposOfOneSubscription)
                  }
                  Promise.all(reposOfAllSubscriptions)
                        .then((allSubscriptions) => {
                              const result = []
                              for (const subscription of allSubscriptions) {
                                    subscription.forEach(repo => {
                                          if (repo.description !== null && isLatest(repo, day_range)) {
                                                result.push(repo)
                                          }
                                    })
                              }
                              result.sort((repo1, repo2) => new Date(repo2.updated_at) - new Date(repo1.updated_at))
                              res.send(result);
                        })
                        .catch((err) => {
                              res.status(500).send(errorRepo);
                        })
            } catch (err) {
                  console.log(err);
                  res.status(500).send(errorRepo);
            }
      } else {
            res.status(400).send({ status: "fail", message: "Please log in." });
      }
})


app.post("/login", function (req, res) {
      res.setHeader("Content-Type", "application/json");
      authenticate(req.body.emailInput, req.body.passwordInput, (userRecord) => {
            if (userRecord == null) {
                  res.status(400).send({ status: "fail", message: "User account not found." });
            } else {
                  // authenticate the user, create a session
                  req.session.loggedIn = true;
                  req.session.email = userRecord.email;
                  req.session.firstName = userRecord.first_name;
                  req.session.lastName = userRecord.last_name;
                  req.session.userID = userRecord.ID;
                  res.send({ status: "success", message: "Logged in." });
            }
      });

});

app.get("/logout", function (req, res) {
      res.setHeader("Content-Type", "application/json");
      if (req.session) {
            req.session.destroy(function (error) {
                  if (error) {
                        res.status(400).send({message: "Unable to log out"})
                  } else {
                        res.redirect("/");
                  }
            });
      }
});


app.use("/", function (req, res) {
      if (req.session.loggedIn) {
            res.redirect("/profile");
      } else {
            res.redirect("/");
      }
});

// RUN SERVER
const port = 8000;
app.listen(port, () => { initDB(port) });