'use strict';

var React = require('react');

var ChatroomSearch = React.createClass({
    // 초기 상태 설정
    getInitialState() {
        return { chatroom: '' };
    },

    // 입력 필드 변경 핸들러
    handleChange(e) {
        this.setState({ chatroom: e.target.value });
    },

    // 채팅방 검색 또는 생성 핸들러
    handleSearch() {
        const { chatroom } = this.state;
        // 서버에 채팅방 이름을 전송하여 존재 여부 확인
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
                    // 채팅방 생성 요청
                    fetch('/chatroom/create', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ chatroom })
                    })
                    .then(response => response.json())
                    .then(data => {
                        // 채팅방 생성 후 참여
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
