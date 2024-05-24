'use strict';

var React = require('react');
var socket = io.connect();

var MyPage = React.createClass({
    getInitialState() {
        return { newName: '', username: this.props.username };
    },

    onKey(e) {
        this.setState({ newName: e.target.value });
    },

    handleSubmit(e) {
        e.preventDefault();
        var newName = this.state.newName;

        fetch('/change-name', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: this.state.username, newName })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.props.onChangeUsername(newName);  // 부모 컴포넌트의 상태를 업데이트합니다.
                socket.emit('change:name', { oldName: this.state.username, newName });
                this.setState({ username: newName, newName: '' });
                alert('아이디가 변경되었습니다.');
            } else {
                alert('아이디 변경에 실패했습니다.');
            }
        });
    },

    render() {
        return (
            <div className='my_page'>
                <h3>아이디 변경</h3>
                <form onSubmit={this.handleSubmit}>
                    <input
                        placeholder='변경할 아이디 입력'
                        onChange={this.onKey}
                        value={this.state.newName}
                    />
                    <button type='submit'>변경</button>
                </form>
            </div>
        );
    }
});

module.exports = MyPage;
