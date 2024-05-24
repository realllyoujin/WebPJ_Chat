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

// Keep track of which names are used so that there are no duplicates
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

    // serialize claimed names as an array
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

// export function for listening to the socket
module.exports = function (io, socket) {
    var username;

    // Join chatroom event
    socket.on('join', ({ chatroomId, chatroomName, username: user }) => {
        username = user;
        if (userNames.claim(username)) {
            socket.join(chatroomId);
            socket.chatroomId = chatroomId;
            socket.chatroomName = chatroomName;
            socket.username = username;
            io.to(chatroomId).emit('user:join', username);
            io.to(chatroomId).emit('updateUsersList', userNames.get());

            // send the new user their name and a list of users
            socket.emit('init', {
                name: username,
                users: userNames.get()
            });

            // notify other clients that a new user has joined
            socket.broadcast.to(chatroomId).emit('user:join', {
                name: username
            });
        } else {
            socket.emit('usernameExists', { message: 'Username already exists' });
        }
    });

    // broadcast a user's message to other users
    socket.on('send:message', function (data) {
        const { chatroomId, text } = data;
        socket.broadcast.to(chatroomId).emit('send:message', {
            user: username,
            text: text
        });

        // 메시지 DB에 저장
        const query = 'INSERT INTO messages (chatroom_id, username, message) VALUES (?, ?, ?)';
        db.query(query, [chatroomId, username, text], (err, results) => {
            if (err) throw err;
        });
    });

    // validate a user's name change, and broadcast it on success
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

    // clean up when a user leaves, and broadcast it to other users
    socket.on('disconnect', function () {
        socket.broadcast.to(socket.chatroomId).emit('user:left', {
            name: username
        });
        userNames.free(username);
        io.to(socket.chatroomId).emit('updateUsersList', userNames.get());
    });
};
