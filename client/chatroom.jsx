'use strict';

var React = require('react');
var socket = io.connect();

var UsersList = React.createClass({
    render() {
        return (
            <div className='users'>
                <h3> 참여자들 </h3>
                <ul>
                    {
                        this.props.users.map((user, i) => {
                            return (
                                <li key={i}>
                                    {user}
                                </li>
                            );
                        })
                    }
                </ul>                
            </div>
        );
    }
});

var Message = React.createClass({
    render() {
        const time = new Date(this.props.timestamp).toLocaleTimeString();
        return (
            <div className="message">
                <strong>{this.props.user} :</strong> 
                <span>{this.props.text}</span>
                <div className="timestamp">{time}</div>
            </div>
        );
    }
});

var MessageList = React.createClass({
    render() {
        return (
            <div className='messages'>
                <h2> 채팅방 </h2>
                {
                    this.props.messages.map((message, i) => {
                        return (
                            <Message
                                key={i}
                                user={message.username}
                                text={message.message}
                                timestamp={message.timestamp}
                            />
                        );
                    })
                } 
            </div>
        );
    }
});

var MessageForm = React.createClass({

    getInitialState() {
        return { text: '' };
    },

    handleSubmit(e) {
        e.preventDefault();
        var message = {
            chatroomId: this.props.chatroomId,
            user: this.props.user,
            text: this.state.text
        };
        socket.emit('send:message', { chatroomId: message.chatroomId, user: message.user, text: message.text, timestamp: new Date() });
        this.setState({ text: '' });
    },

    changeHandler(e) {
        this.setState({ text: e.target.value });
    },

    render() {
        return(
            <div className='message_form'>
                <form onSubmit={this.handleSubmit}>
                    <input
                        placeholder='메시지 입력'
                        className='textinput'
                        onChange={this.changeHandler}
                        value={this.state.text}
                    />
                    <h3></h3>
                </form>
            </div>
        );
    }
});

var Chatroom = React.createClass({

    getInitialState() {
        return { users: [], messages: [], text: '', chatroomId: this.props.chatroomId, chatroomName: this.props.chatroomName };
    },

    componentDidMount() {
        socket.on('init', this._initialize);
        socket.on('send:message', this._messageRecieve);
        socket.on('user:join', this._userJoined);
        socket.on('user:left', this._userLeft);
        socket.on('change:name', this._userChangedName);
        socket.on('updateUsersList', this._updateUsersList);

        if (this.state.chatroomId) {
            socket.emit('join', { chatroomId: this.state.chatroomId, chatroomName: this.state.chatroomName, username: this.props.username });
            fetch(`/messages?chatroomId=${this.state.chatroomId}`)
                .then(response => response.json())
                .then(messages => {
                    this.setState({ messages });
                });
        }
    },

    _initialize(data) {
        var { users, name } = data;
        this.setState({ users, user: name });
    },

    _messageRecieve(message) {
        var { messages } = this.state;
        messages.push(message);
        this.setState({ messages });
    },

    _userJoined(username) {
        var { users } = this.state;
        if (!users.includes(username)) {
            users.push(username);
            this.setState({ users });
        }
    },

    _userLeft(username) {
        var { users } = this.state;
        var index = users.indexOf(username);
        if (index !== -1) {
            users.splice(index, 1);
            this.setState({ users });
        }
    },

    _userChangedName({ oldName, newName }) {
        var { users, messages } = this.state;
        var index = users.indexOf(oldName);
        if (index !== -1) {
            users[index] = newName;
            this.setState({ users });
        }
        messages = messages.map(msg => msg.username === oldName ? { ...msg, username: newName } : msg);
        this.setState({ messages });
    },

    _updateUsersList(users) {
        this.setState({ users });
    },

    handleMessageSubmit(message) {
        socket.emit('send:message', { chatroomId: message.chatroomId, user: message.user, text: message.text, timestamp: new Date() });
    },

    render() {
        return (
            <div>
                <UsersList users={this.state.users} />
                <div className='chatroom_display'>현재 채팅방: {this.state.chatroomName}</div>
                <MessageList messages={this.state.messages} />
                <MessageForm onMessageSubmit={this.handleMessageSubmit} user={this.props.username} chatroomId={this.state.chatroomId} />
            </div>
        );
    }
});

module.exports = Chatroom;
