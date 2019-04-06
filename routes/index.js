let appInstance = require('express');
let db = require('sqlite3').verbose();
let crypto = require('crypto');
let indexRoute = appInstance.Router();

let dbConn;

/* GET home page. */
indexRoute.get('/', function(req, res) {
  res.render('homepage');
});

indexRoute.post('/login', function (req, res) {
  initDB();
  let loginQuery = dbConn.prepare(`SELECT userid FROM users WHERE username=? AND password=?`);
  let passHash = crypto.createHash('sha256').update(req.body.password, 'utf8')
      .digest('hex');
  loginQuery.get([req.body.username, passHash], (error, row) => {
    if (error) {
      console.log(error.message);
    }
    else if (row) {
      req.session.isLoggedIn = true;
      req.session.userid = row.userid;
      res.redirect('/dashboard');
    }
    else {
      req.session.loginAuthFail = true;
      res.redirect('/');
    }
    loginQuery.finalize();
    dbConn.close();
  });
});

indexRoute.post('/signup', function (req, res) {
  initDB();
  let addUserQuery = dbConn.prepare("INSERT INTO users (username,password,email) VALUES (?, ?, ?)");
  let checkUserNameQuery = dbConn.prepare("SELECT count(username) FROM users WHERE username=?");
  let passHash = crypto.createHash('sha256').update(req.body.password, 'utf8')
      .digest('hex');
  checkUserNameQuery.get([req.body.username], (error, row) => {
    if (error) {
      console.log(error.message);
    }
    else if (row) {
      res.render();
    }
    else {
      addUserQuery.run([req.body.username, passHash, req.body.email], (error) => {
        if (!error) {
          console.log('new user: '+ req.body.username);
          res.redirect('/');
        }
      })
    }
    checkUserNameQuery.finalize();
    dbConn.close();
  });
});

indexRoute.get('/dashboard', function (req, res) {
  initDB();
  res.render('dashboard');
});

indexRoute.get('/logout', function (req, res) {
  req.session.destroy(err => {
    if (err) {
      console.log(err.message);
    }
  });
  res.redirect('/');
});

function initDB(){
  dbConn = new db.Database('./app_database.db', (error) => {
    if (error) {
      console.error(error.message);
    }
  });
}

module.exports = indexRoute;
