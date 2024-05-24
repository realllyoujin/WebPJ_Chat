'use strict';

var React = require('react');

var ChatroomSearch = React.createClass({

    getInitialState() {
        return { chatroom: '', chatroomExists: null };
    },

    handleChange(e) {
        this.setState({ chatroom: e.target.value });
    },

    handleSearch(e) {
        e.preventDefault();
        fetch('/chatroom/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ chatroom: this.state.chatroom })
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

    handleCreate(e) {
        e.preventDefault();
        fetch('/chatroom/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ chatroom: this.state.chatroom })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.props.onChatroomJoin(data.chatroomId, this.state.chatroom);
            } else {
                alert('채팅방 생성에 실패했습니다.');
            }
        });
    },

    handleJoin(e) {
        e.preventDefault();
        this.props.onChatroomJoin(this.state.chatroomId, this.state.chatroomName);
    },

    render() {
        return (
            <div className='chatroom_search'>
                <form onSubmit={this.handleSearch}>
                    <input
                        type='text'
                        placeholder='채팅방 이름'
                        value={this.state.chatroom}
                        onChange={this.handleChange}
                    />
                    <button type='submit'>검색</button>
                </form>
                { this.state.chatroomExists === true && 
                    <div>
                        <p>채팅방이 존재합니다. 참여하시겠습니까?</p>
                        <button onClick={this.handleJoin}>예</button>
                    </div>
                }
                { this.state.chatroomExists === false &&
                    <div>
                        <p>채팅방이 존재하지 않습니다. 생성하시겠습니까?</p>
                        <button onClick={this.handleCreate}>예</button>
                    </div>
                }
            </div>
        );
    }
});

module.exports = ChatroomSearch;
