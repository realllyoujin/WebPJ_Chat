'use strict';

var React = require('react');

var socket = io.connect();
var Login = require('./login.jsx');
var ChatApp = require('./chatapp.jsx');
var Register = require('./register.jsx');

var Main = React.createClass({

	//페이지 시작했을때 초기상태
	getInitialState() {
		return { curPage: 'Login', username: '', chatroomId: null };
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

	handleChatroomJoin(chatroomId) {
		this.setState({ chatroomId });
	},

	render() {
		return(
			<div>
			<div>
			{ this.state.curPage === 'Login' && <Login onLoginSuccess={this.handleLoginSuccess} handleRouteRegister={this.handleRouteRegister}/>}
			{ this.state.curPage === 'ChatApp' && <ChatApp username={this.state.username} chatroomId={this.state.chatroomId} onChatroomJoin={this.handleChatroomJoin} />}
			{ this.state.curPage === 'Register' && <Register onRegisterSuccess={this.handleRegisterSuccess} />}
			</div>	
			</div>
		);
	}

});


React.render(<Main/>, document.getElementById('app'));
