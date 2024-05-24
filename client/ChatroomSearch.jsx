'use strict';

var React = require('react');

var ChatroomSearch = React.createClass({
    getInitialState() {
        return { 
            chatroom: '', 
            chatroomExists: null, 
            chatroomId: null,
            chatroomName: ''
        };
    },

    handleInputChange(e) {
        this.setState({ chatroom: e.target.value, chatroomExists: null });
    },

    handleSearchClick() {
        const { chatroom } = this.state;

        fetch('/chatroom/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ chatroom })
        })
        .then(response => response.json())
        .then(data => {
            if (data.exists) {
                this.setState({ chatroomExists: true, chatroomId: data.chatroomId, chatroomName: data.chatroomName });
            } else {
                this.setState({ chatroomExists: false });
            }
        });
    },

    handleJoinClick() {
        this.props.onChatroomJoin(this.state.chatroomId, this.state.chatroomName);
    },

    handleCreateClick() {
        const { chatroom } = this.state;

        fetch('/chatroom/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ chatroom })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.props.onChatroomJoin(data.chatroomId, data.chatroomName);
            } else {
                alert('Error creating chatroom');
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
                <button onClick={this.handleSearchClick}>검색</button>
                {this.state.chatroomExists !== null && (
                    <div>
                        {this.state.chatroomExists ? (
                            <div>
                                <p>채팅방이 존재합니다. 들어가시겠습니까?</p>
                                <button onClick={this.handleJoinClick}>O</button>
                                <button onClick={() => this.setState({ chatroomExists: null })}>X</button>
                            </div>
                        ) : (
                            <div>
                                <p>채팅방이 존재하지 않습니다. 생성하시겠습니까?</p>
                                <button onClick={this.handleCreateClick}>O</button>
                                <button onClick={() => this.setState({ chatroomExists: null })}>X</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }
});

module.exports = ChatroomSearch;
