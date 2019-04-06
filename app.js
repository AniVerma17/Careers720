let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let session = require('express-session');
let logger = require('morgan');

let indexRouter = require('./routes/index');

let app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    name: 'career720login',
    secret: 'majorproject2019webapp',
    resave: false,
    saveUninitialized: false,
    cookie: {sameSite: true},
    unset: 'destroy'
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

module.exports = app;
