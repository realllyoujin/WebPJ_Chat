'use strict';

var React = require('react');
var Login = require('./login.jsx');
var ChatroomSearch = require('./ChatroomSearch.jsx');
var Chatroom = require('./chatroom.jsx');
var Register = require('./register.jsx');

var Main = React.createClass({

	//페이지 시작했을때 초기상태
	getInitialState() {
		return { curPage: 'Login', username: '', chatroomId: null, chatroomName: '' };
	},

	handleLoginSuccess(username) {
		this.setState({ curPage: 'ChatApp', username });
	},

	handleRouteRegister() {
		this.setState({ curPage: 'Register' });
	},

	handleRegisterSuccess(){
		this.setState({ curPage: 'Login' });
	},

	handleChatroomJoin(chatroomId, chatroomName) {
		this.setState({ chatroomId, chatroomName });
	},

	render() {
		return(
			<div>
				{ this.state.curPage === 'Login' && <Login onLoginSuccess={this.handleLoginSuccess} handleRouteRegister={this.handleRouteRegister}/> }
				{ this.state.curPage === 'ChatApp' &&
					<div>
						<ChatroomSearch onChatroomJoin={this.handleChatroomJoin} />
						{ this.state.chatroomId && <Chatroom username={this.state.username} chatroomId={this.state.chatroomId} chatroomName={this.state.chatroomName} /> }
					</div>
				}
				{ this.state.curPage === 'Register' && <Register onRegisterSuccess={this.handleRegisterSuccess} /> }
			</div>
		);
	}

});

React.render(<Main/>, document.getElementById('app'));
