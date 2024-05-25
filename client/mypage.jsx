'use strict';

var React = require('react');
var socket = io.connect();

var MyPage = React.createClass({
    getInitialState() {
        return { newName: '', newPassword: '', username: this.props.username };
    },

    onKey(e) {
        this.setState({ [e.target.name]: e.target.value });
    },

    handleSubmit(e) {
        e.preventDefault();
        var { newName, newPassword } = this.state;

        fetch('/change-credentials', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: this.state.username, newName, newPassword })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('아이디와 비밀번호가 변경되었습니다.');
                window.location.reload(); // 새로고침하여 로그아웃 처리
            } else {
                alert('변경에 실패했습니다: ' + data.message);
            }
        });
    },

    render() {
        return (
            <div className='my_page'>
                <h3>아이디 및 비밀번호 변경</h3>
                <form onSubmit={this.handleSubmit}>
                    <input
                        placeholder='변경할 아이디 입력'
                        name='newName'
                        onChange={this.onKey}
                        value={this.state.newName}
                    />
                    <input
                        type='password'
                        placeholder='변경할 비밀번호 입력'
                        name='newPassword'
                        onChange={this.onKey}
                        value={this.state.newPassword}
                    />
                    <button type='submit'>변경</button>
                </form>
            </div>
        );
    }
});

module.exports = MyPage;
