'use strict';

const express = require('express');
const path = require('path');
const jade = require('jade');
const jadeBabel = require('jade-babel');
const mongoose = require('mongoose');
const logger = require('morgan');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

mongoose.connect(process.env.MONGODB || 'mongodb://localhost/checkers');
mongoose.connection.on('error', () => {
  console.log('MongoDB connection error. Please make sure MongoDB is running.');
  process.exit(1);
});

app.set('port', process.env.PORT || 3000);
app.set('view engine', 'jade');
app.set('views', path.join(__dirname, 'views'));
jade.filters.babel = jadeBabel({});

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'yoyoyo',
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  res.locals.basedir = path.join(__dirname, 'views');
  next();
});
// dev middleware
app.use((req, res, next) => {
  console.log(req.sessionID);
  next();
});

const mainCtrl = require('./controllers/main');

app.get('/', (req, res) => {
  mainCtrl.index(req, res, io);
});

http.listen(app.get('port'), () => {
  console.log(`App listening on port ${app.get('port')}!`);
});
