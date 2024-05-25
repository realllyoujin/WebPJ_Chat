'use strict';

var React = require('react');
var socket = io.connect();
var Login = require('./login.jsx');
var ChatroomSearch = require('./ChatroomSearch.jsx');
var Chatroom = require('./chatroom.jsx');
var MyPage = require('./mypage.jsx');
var Register = require('./register.jsx');
var Sidebar = require('./sidebar.jsx');

var Main = React.createClass({

    getInitialState() {
        return { curPage: 'Login', username: '', chatroomId: null, chatroomName: '', showSearch: false, showChatroom: false, chatroomKey: 0 };
    },

    handleLoginSuccess(username) {
        this.setState({ curPage: 'ChatApp', username });
    },

    handleRouteRegister() {
        this.setState({ curPage: 'Register' });
    },

    handleRegisterSuccess() {
        this.setState({ curPage: 'Login' });
    },

    handleChatroomJoin(chatroomId, chatroomName) {
        if (this.state.chatroomId) {
            socket.emit('leave', { chatroomId: this.state.chatroomId, username: this.state.username });
        }
        this.setState({ chatroomId, chatroomName, showSearch: false, showChatroom: true, chatroomKey: this.state.chatroomKey + 1 }, () => {
            socket.emit('join', { chatroomId, chatroomName, username: this.state.username });
        });
    },

    handleNavigation(page) {
        if (page === 'ChatroomSearch') {
            if (this.state.chatroomId) {
                socket.emit('leave', { chatroomId: this.state.chatroomId, username: this.state.username });
                this.setState({ chatroomId: null, chatroomName: '', showChatroom: false });
            }
            this.setState({ showSearch: true, curPage: 'ChatApp' });
        } else {
            this.setState({ curPage: page, showSearch: false, showChatroom: false });
        }
    },

    handleChangeUsername(newUsername) {
        const oldUsername = this.state.username;
        this.setState({ username: newUsername });
        socket.emit('change:name', { oldName: oldUsername, newName: newUsername });
    },

    render() {
        return (
            <div className='main'>
                { this.state.curPage === 'Login' && <Login onLoginSuccess={this.handleLoginSuccess} handleRouteRegister={this.handleRouteRegister}/> }
                { this.state.curPage !== 'Login' && this.state.curPage !== 'Register' &&
                    <Sidebar onNavigate={this.handleNavigation} />
                }
                { this.state.curPage === 'ChatApp' && this.state.showSearch &&
                    <ChatroomSearch onChatroomJoin={this.handleChatroomJoin} />
                }
                { this.state.curPage === 'ChatApp' && this.state.showChatroom &&
                    <Chatroom key={this.state.chatroomKey} username={this.state.username} chatroomId={this.state.chatroomId} chatroomName={this.state.chatroomName} />
                }
                { this.state.curPage === 'MyPage' && 
                    <MyPage username={this.state.username} onChangeUsername={this.handleChangeUsername} />
                }
                { this.state.curPage === 'Register' && <Register onRegisterSuccess={this.handleRegisterSuccess} /> }
            </div>
        );
    }
});

React.render(<Main/>, document.getElementById('app'));
