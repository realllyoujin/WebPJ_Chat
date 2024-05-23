'use strict';

/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');

var socket = require('./routes/socket.js');

var app = express();
var server = http.createServer(app);

/* mysql & login */
const mysql = require('mysql');
const bodyParser = require('body-parser');

app.use(bodyParser.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'kimyoujin',
    password: '1234',
    database: 'webchatdb'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.query(query, [username, password], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    });
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;

    const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.query(query, [username, password], (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                res.json({ success: false, message: 'User already exists' });
            } else {
                throw err;
            }
        } else {
            res.json({ success: true });
        }
    });
});

/* Configuration */
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.set('port', 3000);

if (process.env.NODE_ENV === 'development') {
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
}

/* Socket.io Communication */
var io = require('socket.io').listen(server);
io.sockets.on('connection', socket);

/* Start server */
server.listen(app.get('port'), function (){
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

module.exports = app;
