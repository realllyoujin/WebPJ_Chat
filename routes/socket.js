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

var userNames = (function () {
    var names = {};

    var claim = function (name) {
        if (!name || names[name]) {
            return false;
        } else {
            names[name] = true;
            return true;
        }
    };

    var get = function () {
        var res = [];
        for (var user in names) {
            res.push(user);
        }

        return res;
    };

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

module.exports = function (io, socket) {
    var username;
    
    /*
    socket.on('join', ({ chatroomId, chatroomName, username: user }) => {
        username = user;
        if (userNames.claim(username)) {
            socket.join(chatroomId);
            socket.chatroomId = chatroomId;
            socket.chatroomName = chatroomName;
            socket.username = username;

            socket.emit('init', {
                name: username,
                users: userNames.get()
            });

            socket.broadcast.to(chatroomId).emit('user:join', {
                name: username
            });

            io.to(chatroomId).emit('updateUsersList', userNames.get());
        } else {
            socket.emit('usernameExists', { message: 'Username already exists' });
        }
    });
    */

    socket.on('join', ({ chatroomId, chatroomName, username: user }) => {
        
        const insertQuery = 'INSERT INTO chatroom_users (chatroom_id, user_name) VALUES (?, ?)';
        db.query(insertQuery, [chatroomId, user], (err, results) => {
            if (err) { throw err;}
    
            // 사용자 목록 업데이트 
            const selectQuery = 'SELECT user_name, COUNT(*) user_cnt FROM chatroom_users WHERE chatroom_id = ? GROUP BY user_name';
            db.query(selectQuery, [chatroomId], (err, results) => {
                if (err) { throw err; }
    
                const userList = results.map(row => row.user_name);
    
                socket.join(chatroomId);
                socket.chatroomId = chatroomId;
                socket.chatroomName = chatroomName;
                socket.username = user;
    
                socket.emit('init', {
                    name: user,
                    users: userList
                });
    
                socket.broadcast.to(chatroomId).emit('user:join', {
                    name: user
                });
    
                io.to(chatroomId).emit('updateUsersList', userList);
            });
        });
    });
    
    socket.on('send:message', function (data) {
        console.log(JSON.stringify(data));

        const { chatroomId, text } = data;
        const timestamp = new Date();
        
        const messageData = {
            username: data.username,
            message: text,
            timestamp: timestamp
        };

        io.to(chatroomId).emit('send:message', messageData);

        const query = 'INSERT INTO messages (chatroom_id, username, message, timestamp) VALUES (?, ?, ?, ?)';
        db.query(query, [chatroomId, data.username, text, timestamp], (err, results) => {
            if (err) throw err;
        });
    });

    socket.on('change:name', function (data, fn) {
        if (userNames.claim(data.newName)) {
            var oldName = username;
            userNames.free(oldName);

            username = data.newName;

            socket.broadcast.to(socket.chatroomId).emit('change:name', {
                oldName: oldName,
                newName: username
            });

            if (typeof fn === 'function') {
                fn(true);
            }
        } else {
            if (typeof fn === 'function') {
                fn(false);
            }
        }
    });

    socket.on('leave', function (data) {
        socket.leave(data.chatroomId);
    
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