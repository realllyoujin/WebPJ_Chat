'use strict';

var React = require('react');
var socket = io.connect();

// 각 컴포넌트 불러오기
var Login = require('./login.jsx');
var ChatroomSearch = require('./ChatroomSearch.jsx');
var Chatroom = require('./chatroom.jsx');
var MyPage = require('./mypage.jsx');
var Register = require('./register.jsx');
var Sidebar = require('./sidebar.jsx');

// 메인 컴포넌트 생성
var Main = React.createClass({

	// 초기 상태 설정
    getInitialState() {
        return { curPage: 'Login', username: '', chatroomId: null, chatroomName: '', showSearch: false, showChatroom: false, chatroomKey: 0 };
    },
	// 로그인 성공시 호출 함수
    handleLoginSuccess(username) {
        this.setState({ curPage: 'ChatApp', username });
    },
	// 회원가입 페이지로 이동하는 함수
    handleRouteRegister() {
        this.setState({ curPage: 'Register' });
    },
	// 회원가입 성공 시 호출되는 함수
    handleRegisterSuccess() {
        this.setState({ curPage: 'Login' });
    },
	// 채팅방 입장 시 호출되는 함수
    handleChatroomJoin(chatroomId, chatroomName) {
        if (this.state.chatroomId) {
            socket.emit('leave', { chatroomId: this.state.chatroomId, username: this.state.username });
        } // 현재 사용자가 이미 다른 채팅방에 참여 중인 경우, 이전 채팅방에서 나가기
        this.setState({ chatroomId, chatroomName, showSearch: false, showChatroom: true, chatroomKey: this.state.chatroomKey + 1 }, () => {
            socket.emit('join', { chatroomId, chatroomName, username: this.state.username });
        }); // React가 새로운 채팅방을 렌더링하도록 함
    },
	// 네비게이션을 처리하는 함수 ( 사용자가 다른 페이지로 이동 시 호출 )
    handleNavigation(page) {
        if (page === 'ChatroomSearch') {
            if (this.state.chatroomId) {
                socket.emit('leave', { chatroomId: this.state.chatroomId, username: this.state.username });
                this.setState({ chatroomId: null, chatroomName: '', showChatroom: false });
            } // 사용자가 채팅방 검색 페이지로 이동하는 경우, 사용자가 이미 다른 채팅방에 참여 중인 경우, 이전 채팅방에서 나가기 후 채팅방 검색 페이지 보이기
            this.setState({ showSearch: true, curPage: 'ChatApp' });
        } else {
            this.setState({ curPage: page, showSearch: false, showChatroom: false });
        }
    },
	// 사용자 이름 변경시 호출되는 함수
    handleChangeUsername(newUsername) {
        const oldUsername = this.state.username;
        this.setState({ username: newUsername });
        socket.emit('change:name', { oldName: oldUsername, newName: newUsername });
    },

	// 화면 랜더링을 처리하는 함수
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
