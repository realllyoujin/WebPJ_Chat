'use strict';

var React = require('react');

var ChatroomSearch = React.createClass({
    getInitialState() {
        return { chatroom: '' };
    },

    handleChange(e) {
        this.setState({ chatroom: e.target.value });
    },

    handleSearch() {
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
                this.props.onChatroomJoin(data.chatroomId, data.chatroomName);
            } else {
                if (window.confirm('채팅방이 없습니다. 생성하시겠습니까?')) {
                    fetch('/chatroom/create', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ chatroom })
                    })
                    .then(response => response.json())
                    .then(data => {
                        this.props.onChatroomJoin(data.chatroomId, data.chatroomName);
                    });
                }
            }
        });
    },

    render() {
        return (
            <div className='chatroom_search'>
                <h3>채팅방 검색</h3>
                <input
                    type='text'
                    placeholder='채팅방 이름 입력'
                    value={this.state.chatroom}
                    onChange={this.handleChange}
                />
                <button onClick={this.handleSearch}>검색</button>
            </div>
        );
    }
});

module.exports = ChatroomSearch;
