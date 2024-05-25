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

    socket.on('send:message', function (data) {
        const { chatroomId, text } = data;
        const timestamp = new Date();

        const messageData = {
            username: username,
            message: text,
            timestamp: timestamp
        };

        io.to(chatroomId).emit('send:message', messageData);

        const query = 'INSERT INTO messages (chatroom_id, username, message, timestamp) VALUES (?, ?, ?, ?)';
        db.query(query, [chatroomId, username, text, timestamp], (err, results) => {
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
        io.to(data.chatroomId).emit('updateUsersList', userNames.get());
    });

    socket.on('disconnect', function () {
        if (socket.chatroomId) {
            socket.broadcast.to(socket.chatroomId).emit('user:left', {
                name: username
            });
            userNames.free(username);
            io.to(socket.chatroomId).emit('updateUsersList', userNames.get());
        }
    });
};
