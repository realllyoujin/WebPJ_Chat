'use strict';

var React = require('react');

var socket = io.connect();
var Login = require('./login.jsx');
var ChatApp = require('./chatapp.jsx');
var Register = require('./register.jsx');

var Main = React.createClass({

	//페이지 시작했을때 초기상태
	getInitialState() {
		return { curPage: 'Login' };
	},

	handleLoginSuccess() {
		this.setState ({ curPage: 'ChatApp'});
	},

	handleRouteRegister() {
		this.setState ({ curPage: 'Register'});
	},

	render() {
		return(
			<div>
			<div>
			{ this.state.curPage === 'Login' && <Login onLoginSuccess={this.handleLoginSuccess} handleRouteRegister={this.handleRouteRegister}/>}
			{ this.state.curPage === 'ChatApp' && <ChatApp/>}
			{ this.state.curPage === 'Register' && <Register/>}
			</div>	
			</div>
		);
	}

});


React.render(<Main/>, document.getElementById('app'));