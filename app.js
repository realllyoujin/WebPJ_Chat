'use strict';


/* Module dependencies.*/
var express = require('express');
var http = require('http');

// 소켓 핸들러 모듈 불러오기
var socketHandler = require('./routes/socket.js');

// Express 애플리케이션 인스턴스 생성
var app = express();

// Express 애플리케이션을 사용해 HTTP 서버 생성
var server = http.createServer(app);

/* mysql & login */
const mysql = require('mysql');
const bodyParser = require('body-parser');

// JSON 형식의 요청 본문을 파싱하기 위해 body-parser를 사용합니다
app.use(bodyParser.json());

// Mysql 데이터베이스 연결
const db = mysql.createConnection({
    host: 'localhost',
    user: 'kimyoujin',
    password: '1234',
    database: 'webchatdb'
});

// 데이터베이스에 연결
db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database');
});

// 로그인 요청 처리
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

// 회원가입 요청 처리
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

    const query = 'SELECT * FROM chatrooms WHERE name = ? ';
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

    const query = 'SELECT username, message, timestamp FROM messages WHERE chatroom_id = ?';
    db.query(query, [chatroomId], (err, results) => {
        if (err) throw err;
        res.json(results.map(row => ({
            username: row.username,
            message: row.message,
            timestamp: row.timestamp
        })));
    });
});

app.post('/change-credentials', (req, res) => {
    const { username, newName, newPassword } = req.body;
    
    // Check if the new username already exists
    const checkQuery = 'SELECT * FROM users WHERE username = ?';
    db.query(checkQuery, [newName], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            res.json({ success: false, message: 'User already exists' });
        } else {
            // Proceed with updating the username and password
            const query = 'UPDATE users SET username = ?, password = ? WHERE username = ?';
            db.query(query, [newName, newPassword, username], (err, result) => {
                if (err) {
                    throw err;
                } else {
                    res.json({ success: true, newName });
                }
            });
        }
    });
});

/* Configuration */
// 뷰 파일들이 위치한 디렉토리를 설정합니다.
app.set('views', __dirname + '/views');
// 정적 파일들이 위치한 디렉토리를 설정합니다.
app.use(express.static(__dirname + '/public'));
// 서버 포트 설정
app.set('port', 3000);

// 개발 환경 설정
if (process.env.NODE_ENV === 'development') {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
}

/* Socket.io Communication */
// 소켓 연결 설정. 소켓 연결시 이벤트 처리
var io = require('socket.io').listen(server);
io.sockets.on('connection', (socket) => {
    socketHandler(io, socket);
});

/* Start server */
server.listen(app.get('port'), function () {
    console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

module.exports = app;
