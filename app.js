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
            res.json({ success: true, username });
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

app.post('/chatroom/check', (req, res) => {
    const { chatroom } = req.body;

    const query = 'SELECT * FROM chatrooms WHERE name = ?';
    db.query(query, [chatroom], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            res.json({ exists: true, chatroomId: results[0].id, chatroomName: results[0].name });
        } else {
            res.json({ exists: false });
        }
    });
});

app.post('/chatroom/create', (req, res) => {
    const { chatroom } = req.body;

    const insertQuery = 'INSERT INTO chatrooms (name) VALUES (?)';
    db.query(insertQuery, [chatroom], (err, result) => {
        if (err) throw err;
        res.json({ success: true, chatroomId: result.insertId, chatroomName: chatroom });
    });
});

app.get('/messages', (req, res) => {
    const { chatroomId } = req.query;

    const query = 'SELECT * FROM messages WHERE chatroom_id = ?';
    db.query(query, [chatroomId], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.post('/change-name', (req, res) => {
    const { username, newName } = req.body;

    const query = 'UPDATE users SET username = ? WHERE username = ?';
    db.query(query, [newName, username], (err, result) => {
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
io.sockets.on('connection', (socket) => {
    socket.on('join', ({ chatroomId, chatroomName, username }) => {
        socket.join(chatroomId);
        socket.chatroomId = chatroomId;
        socket.chatroomName = chatroomName;
        socket.username = username;
        io.to(chatroomId).emit('user:join', username);

        socket.on('send:message', (message) => {
            const { text } = message;
            const query = 'INSERT INTO messages (chatroom_id, username, message) VALUES (?, ?, ?)';
            db.query(query, [chatroomId, username, text], (err) => {
                if (err) throw err;
                io.to(chatroomId).emit('send:message', { user: username, text });
            });
        });

        socket.on('disconnect', () => {
            io.to(chatroomId).emit('user:left', username);
        });
    });
});


/* Start server */
server.listen(app.get('port'), function (){
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

module.exports = app;
