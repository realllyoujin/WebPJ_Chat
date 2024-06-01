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

// 채팅 메세지 컴포넌트
var Message = React.createClass({
    render() {
        // 타임스탬프를 현지 시간으로 변환
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

// 채팅 메세지 목록 컴포넌트
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

// 채팅 메세지 입력 폼 컴포넌트
var MessageForm = React.createClass({

    getInitialState() {
        return { text: '' };
    },

    // 메세지 전송 핸들러
    handleSubmit(e) {
        e.preventDefault();
        var message = {
            chatroomId: this.props.chatroomId,
            user: this.props.user,
            text: this.state.text
        };
        // 서버로 메세지 전송
        socket.emit('send:message', { chatroomId: message.chatroomId, text: message.text });
        // 입력 필드 초기화
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

// 채팅방 컴포넌트
var Chatroom = React.createClass({

    getInitialState() {
        return { users: [], messages: [], text: '', chatroomId: this.props.chatroomId, chatroomName: this.props.chatroomName };
    },

    //컴포넌트가 마운트되면 실행되는 메소드
    componentDidMount() {
        // 소켓 이벤트 핸들러 등록
        socket.on('init', this._initialize);
        socket.on('send:message', this._messageRecieve);
        socket.on('user:join', this._userJoined);
        socket.on('user:left', this._userLeft);
        socket.on('change:name', this._userChangedName);
        socket.on('updateUsersList', this._updateUsersList);

        // 채팅방 입장
        if (this.state.chatroomId) {
            socket.emit('join', { chatroomId: this.state.chatroomId, chatroomName: this.state.chatroomName, username: this.props.username });
            //채팅방 메세지 불러오기
            fetch(`/messages?chatroomId=${this.state.chatroomId}`)
                .then(response => response.json())
                .then(messages => {
                    this.setState({ messages });
                });
        }
    },

    // 컴포넌트가 언마운트되면 실행되는 메소드
    componentWillUnmount() {
        // 소켓 이벤트 핸들러 제거
        if (this.state.chatroomId) {
            socket.emit('leave', { chatroomId: this.state.chatroomId, username: this.props.username });
        }
        socket.off('init', this._initialize);
        socket.off('send:message', this._messageRecieve);
        socket.off('user:join', this._userJoined);
        socket.off('user:left', this._userLeft);
        socket.off('change:name', this._userChangedName);
        socket.off('updateUsersList', this._updateUsersList);
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

    // 사용자 퇴장 핸들러
    _userLeft(username) {
        var { users } = this.state;
        var index = users.indexOf(username);
        if (index !== -1) {
            users.splice(index, 1);
            this.setState({ users });
        }
    },

    //사용자 이름 변경 핸들러
    _userChangedName({ oldName, newName }) {
        var { users, messages } = this.state;
        var index = users.indexOf(oldName);
        if (index !== -1) {
            users[index] = newName;
            this.setState({ users });
        }
        // 메세지 중 사용자 이름 변경
        messages = messages.map(msg => msg.username === oldName ? { ...msg, username: newName } : msg);
        this.setState({ messages });
    },
    // 사용자 목록 업데이트
    _updateUsersList(users) {
        this.setState({ users });
    },

    handleMessageSubmit(message) {
        // 서버로 메세지 전송
        socket.emit('send:message', { chatroomId: message.chatroomId, text: message.text });
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
