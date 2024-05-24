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
        return { curPage: 'Login', username: '', chatroomId: null, chatroomName: '' };
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
        this.setState({ chatroomId, chatroomName });
    },

    handleNavigation(page) {
        this.setState({ curPage: page });
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
                { this.state.curPage === 'ChatApp' &&
                    <div>
                        <ChatroomSearch onChatroomJoin={this.handleChatroomJoin} />
                        { this.state.chatroomId && <Chatroom username={this.state.username} chatroomId={this.state.chatroomId} chatroomName={this.state.chatroomName} /> }
                    </div>
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
