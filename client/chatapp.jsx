'use strict';

var React = require('react');
var socket = io.connect();

// 사용자 목록을 보여주는 컴포넌트
var UsersList = React.createClass({
	render() {
		return (
			<div className='users'>
				<h3> 참여자들 </h3>
				<ul>
					{
						// 사용자 목록을 매핑하여 리스트로 보여줌
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

// 채팅 메세지를 표시
var Message = React.createClass({
	render() {
		return (
			<div className="message">
				<strong>{this.props.user} :</strong> 
				<span>{this.props.text}</span>		
			</div>
		);
	}
});

// 채팅 메시지 목록을 표시하는 컴포넌트
var MessageList = React.createClass({
	render() {
		return (
			<div className='messages'>
				<h2> 채팅방 </h2>
				{
					// 채팅 메세지 목록을 매핑하여 각각의 메세지를 표시
					this.props.messages.map((message, i) => {
						return (
							<Message
								key={i}
								user={message.user}
								text={message.text} 
							/>
						);
					})
				} 
			</div>
		);
	}
});

// 메세지 입력 폼 컴포넌트
var MessageForm = React.createClass({

	getInitialState() {
		return {text: ''}; // 초기 상태
	},

	handleSubmit(e) {
		e.preventDefault(); // 이벤트의 기본 동작을 막는다. 즉, 폼이 제출될 때 페이지를 새로고침 하지 않도록 함
		var message = {
			user : this.props.user, // props로 부터 사용자의 이름 가져옴.
			text : this.state.text // state로부터 입력된 텍스트를 가져온다.
		}
		// 메세지를 전송하는 call back 함수 호출
		this.props.onMessageSubmit(message); // 메세지 전송
		this.setState({ text: '' }); // 폼 리셋
	},

	changeHandler(e) {
		// 입력 필드의 값이 변경될 때마다 호출된다.
		// 입력된 텍스트를 state에 반영하여 동적으로 UI 업데이트
		this.setState({ text : e.target.value }); // 입력된 텍스트 변경
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

// 사용자 이름 변경
var ChangeNameForm = React.createClass({
	getInitialState() {
		return {newName: ''};
	},

	onKey(e) {
		this.setState({ newName : e.target.value }); //새로운 이름 입력
	},

	handleSubmit(e) {
		e.preventDefault();
		var newName = this.state.newName;
		this.props.onChangeName(newName); // 이름 변경
		this.setState({ newName: '' });
	},

	render() {
		return(
			<div className='change_name_form'>
				<h3> 아이디 변경 </h3>
				<form onSubmit={this.handleSubmit}>
					<input
						placeholder='변경할 아이디 입력'
						onChange={this.onKey}
						value={this.state.newName} 
					/>
				</form>	
			</div>
		);
	}
});

// 채팅방 검색 및 참여 컴포넌트
var ChatroomSearch = React.createClass({
    getInitialState() {
        return { chatroom: '' };
    },

    handleInputChange(e) {
        this.setState({ chatroom: e.target.value }); // 채팅방 이름 입력
    },

    handleSearchClick() {
        const { chatroom } = this.state;

		// 서버에 채팅방 참여 요청
        fetch('/chatroom', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ chatroom })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.props.onChatroomJoin(data.chatroomId);
            } else {
                alert('Error creating or joining chatroom');
            }
        });
    },

    render() {
        return (
            <div className='chatroom_search'>
                <h3> 채팅방 검색 또는 생성 </h3>
                <input
                    type="text"
                    value={this.state.chatroom}
                    onChange={this.handleInputChange}
                    placeholder="채팅방 이름"
                />
                <button onClick={this.handleSearchClick}>참여</button>
            </div>
        );
    }
});

// 채팅 앱 
var ChatApp = React.createClass({

	getInitialState() {
		return {users: [], messages:[], text: '', chatroomId: null};
	},

	componentDidMount() {
		// 소켓 이벤트 핸들러 등록
		socket.on('init', this._initialize);
		socket.on('send:message', this._messageRecieve);
		socket.on('user:join', this._userJoined);
		socket.on('user:left', this._userLeft);
		socket.on('change:name', this._userChangedName);
	},

	// 초기 사용자 목록 설정
	_initialize(data) {
		var {users, name} = data;
		this.setState({users, user: name});
	},

	
	_messageRecieve(message) {
		var {messages} = this.state;
		messages.push(message); // 새로운 메세지 추가
		this.setState({messages});
	},

	handleMessageSubmit(message) {
		var {messages} = this.state;
		messages.push(message);
		this.setState({messages});
		socket.emit('send:message', message); // 메세지 전송
	},

	handleChangeName(newName) {
		var oldName = this.state.user;
		socket.emit('change:name', { name : newName}, (result) => {
			if(!result) {
				return alert('There was an error changing your name');
			}
			var {users} = this.state;
			var index = users.indexOf(oldName);
			users.splice(index, 1, newName);
			this.setState({users, user: newName}); // 사용자 이름 변경
		});
	},

    handleChatroomJoin(chatroomId) {
        socket.emit('join', { chatroomId, username: this.props.username }); // 채팅방 참여 요청
        fetch(`/messages?chatroomId=${chatroomId}`)
            .then(response => response.json())
            .then(messages => {
                this.setState({ chatroomId, messages }); // 채팅방 메세지 가져오기
            });
    },

	render() {
		return (
			<div>
			<div className='center'>
            <div className='username_display'>현재 로그인: {this.props.username}</div>
			{!this.state.chatroomId && <ChatroomSearch onChatroomJoin={this.handleChatroomJoin} />}
			{this.state.chatroomId && (
                <div>
                    <UsersList users={this.state.users} />
                    <ChangeNameForm onChangeName={this.handleChangeName} />
                    <div className='chatroom_display'>현재 채팅방: {this.state.chatroomId}</div>
                    <MessageList messages={this.state.messages} />
                    <MessageForm onMessageSubmit={this.handleMessageSubmit} user={this.state.user} />
                </div>
            )}
			</div>
			</div>
		);
	}
});

module.exports = ChatApp;
