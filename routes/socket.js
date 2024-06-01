const mysql = require('mysql');

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

// 사용자 이름을 관리하기 위한 객체
var userNames = (function () {
    var names = {};

    // 사용자 이름 예약
    var claim = function (name) {
        if (!name || names[name]) {
            return false;
        } else {
            names[name] = true;
            return true;
        }
    };

    // 현재 예약된 사용자 이름 반환
    var get = function () {
        var res = [];
        for (var user in names) {
            res.push(user);
        }

        return res;
    };

    // 사용자 이름 반환
    var free = function (name) {
        if (names[name]) {
            delete names[name];
        }
    };

    return {
        claim: claim,
        free: free,
        get: get
    };
}());

// 소켓 이벤트 핸들러 모듈을 내보내기
module.exports = function (io, socket) {
    var username;
    
    // 채팅방 입장 이벤트 처리
    socket.on('join', ({ chatroomId, chatroomName, username: user }) => {
        
        // 데이터베이스에 사용자 등록
        const insertQuery = 'INSERT INTO chatroom_users (chatroom_id, user_name) VALUES (?, ?)';
        db.query(insertQuery, [chatroomId, user], (err, results) => {
            if (err) { throw err;}
    
            // 사용자 목록 업데이트 
            const selectQuery = 'SELECT user_name, COUNT(*) user_cnt FROM chatroom_users WHERE chatroom_id = ? GROUP BY user_name';
            db.query(selectQuery, [chatroomId], (err, results) => {
                if (err) { throw err; }
    
                const userList = results.map(row => row.user_name);
                
                // 소켓에 사용자 정보 저장
                socket.join(chatroomId);
                socket.chatroomId = chatroomId;
                socket.chatroomName = chatroomName;
                socket.username = user;
    
                // 클라이언트에 초기 데이터 전송
                socket.emit('init', {
                    name: user,
                    users: userList
                });
                
                // 새로운 사용자 입장 알림
                socket.broadcast.to(chatroomId).emit('user:join', {
                    name: user
                });
    
                // 모든 클라이언트에 사용자 목록 업데이트
                io.to(chatroomId).emit('updateUsersList', userList);
            });
        });
    });
    
    // 메세지 전송 이벤트 처리
    socket.on('send:message', function (data) {
        console.log(JSON.stringify(data));

        const { chatroomId, text } = data;
        const timestamp = new Date();
        
        const messageData = {
            username: data.username,
            message: text,
            timestamp: timestamp
        };

        // 메세지를 모든 클라이언트에게 전송
        io.to(chatroomId).emit('send:message', messageData);

        // 데이터베이스에 메세지 저장
        const query = 'INSERT INTO messages (chatroom_id, username, message, timestamp) VALUES (?, ?, ?, ?)';
        db.query(query, [chatroomId, data.username, text, timestamp], (err, results) => {
            if (err) throw err;
        });
    });


    // 닉네임 변경 이벤트 처리
    socket.on('change:name', function (data, fn) {
        if (userNames.claim(data.newName)) {
            var oldName = username;
            userNames.free(oldName);

            // 새로운 닉네임으로 변경
            username = data.newName;

            // 다른 클라이언트에게 닉네임 변경 알림
            socket.broadcast.to(socket.chatroomId).emit('change:name', {
                oldName: oldName,
                newName: username
            });

            // 변경 성공 실패 여부 응답
            if (typeof fn === 'function') {
                fn(true);
            }
        } else {
            if (typeof fn === 'function') {
                fn(false);
            }
        }
    });

    // 채팅방 나가기 이벤트 처리
    socket.on('leave', function (data) {
        socket.leave(data.chatroomId);
    
        //다른 사용자들에게 사용자 퇴장 알림
        socket.broadcast.to(data.chatroomId).emit('user:left', {
            name: data.username
        });
        userNames.free(data.username);
    
        // 데이터베이스에서도 사용자를 제거합니다.
        const deleteQuery = 'DELETE FROM chatroom_users WHERE chatroom_id = ? AND user_name = ?';
        db.query(deleteQuery, [data.chatroomId, data.username], (err, results) => {
            if (err) { throw err }
            console.log('User removed from the chatroom:', data.username);
            
            // 사용자 목록을 업데이트합니다.
            const selectQuery = 'SELECT user_name, COUNT(*) AS user_cnt FROM chatroom_users WHERE chatroom_id = ? GROUP BY user_name';
                db.query(selectQuery, [data.chatroomId], (err, results) => {
                    if (err) { throw err; }
                const userList = results.map(row => row.user_name);
                io.to(data.chatroomId).emit('updateUsersList', userList);
            });
        });
    });
    
    // 연결 종료 이벤트 처리
    socket.on('disconnect', function () {
        if (socket.chatroomId) {
            const deleteQuery = 'DELETE FROM chatroom_users WHERE chatroom_id = ? AND user_name = ?';
            db.query(deleteQuery, [socket.chatroomId, socket.username], (err, results) => {
                if (err) { throw err }
                console.log('User removed from the chatroom:', socket.username);
                
                socket.broadcast.to(socket.chatroomId).emit('user:left', {
                    name: username
                });
                
                const selectQuery = 'SELECT user_name, COUNT(*) AS user_cnt FROM chatroom_users WHERE chatroom_id = ? GROUP BY user_name';
                db.query(selectQuery, [socket.chatroomId], (err, results) => {
                    if (err) { throw err; }
                    const userList = results.map(row => row.user_name);
                    io.to(socket.chatroomId).emit('updateUsersList', userList);
                });
                /*
                userNames.free(username);
                io.to(socket.chatroomId).emit('updateUsersList', userNames.get());
                socket.emit();
                */
            });
        }
    });
};