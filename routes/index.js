let appInstance = require('express');
let db = require('sqlite3').verbose();
let multer = require('multer');
let crypto = require('crypto');
let indexRoute = appInstance.Router();

let dbConn;

/* GET home page. */
indexRoute.get('/', function(req, res) {
    let didFail = req.session.loginAuthFail || false;
    req.session.loginAuthFail = false;
    res.render('homepage', { loginFail: didFail });
});

indexRoute.get('/createAccount', function(req, res) {
    res.render('signup');
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
            req.session.loginAuthFail = false;
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
let imgpath = {dest:"/profileImages", file:"pic_" + Date.now() + ".jpg"};
let imgUpload = multer({
    storage: multer.diskStorage({
        destination: function(req, file, callback) {
            callback(null, "./public/" + imgpath.dest);
        },
        filename: function(req, file, callback) {
            callback(null, imgpath.file);
        }
    })
}).single('profile_pic');
indexRoute.post('/signup',imgUpload, function (req, res, next) {
    initDB();
    let addUserQuery = dbConn.prepare("INSERT INTO users (username,password,email,name,profile_picture,qualification,skills,profile_score) VALUES (?,?,?,?,?,?,?,?)");
    let checkUserNameQuery = dbConn.prepare("SELECT count(username) FROM users WHERE username=?");
    let passHash = crypto.createHash('sha256').update(req.body.password, 'utf8').digest('hex');
    let profileScore;
    checkUserNameQuery.get([req.body.username], (error, row) => {
        if (error) {
            console.log(error.message);
        }
        else if (row.count > 0) {
            req.session.usernameExists = true;
            res.redirect('/createAccount');
        }
        else {
            req.session.usernameExists = false;
            switch (req.body.qualification) {
                case 'grad':
                    profileScore = 2;
                    break;
                case 'postgrad':
                    profileScore = 3;
                    break;
                case 'phd':
                    profileScore = 4;
                    break;
                case 'diploma':
                    profileScore = 1;
                    break;
                default:
                    profileScore = 0;
            }
            addUserQuery.run([req.body.username, passHash, req.body.email, req.body.name,"."+imgpath.dest+"/"+imgpath.file,
                req.body.qualification, req.body.skills, profileScore], (error) => {
                if (!error) {
                    console.log('new user: '+ req.body.username);
                    req.session.signupSuccess = true;
                    res.redirect('/');
                }
                addUserQuery.finalize();
            })
        }
        checkUserNameQuery.finalize();
    });
});

indexRoute.get('/dashboard', function (req, res) {
    if (!req.session.isLoggedIn) {
        res.redirect('/');
        return;
    }
    initDB();
    let userData;
    dbConn.get("SELECT * FROM users WHERE userid = ?", [req.session.userid], (err, row) => {
        if (!err && row) {
            dbConn.all("SELECT * FROM job_posts WHERE eligibility_score <= ?", [row.profile_score],
                (err, rows) => {
                    res.render('dashboard', {userData: row, posts:rows});
                });
        }
    });
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
