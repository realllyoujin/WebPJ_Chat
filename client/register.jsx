'use strict';

var React = require('react');

var Register = React.createClass({
    getInitialState() {
        return {
            username: '',
            password: ''
        };
    },

    handleInputChange(e) {
        const { name, value } = e.target;
        this.setState({ [name]: value });
    },

    handleRegisterClick() {
        const { username, password } = this.state;

        fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.props.onRegisterSuccess();
                alert('회원가입 성공');
            } else {
                alert('회원가입 실패: ' + data.message);
            }
        });
    },

    render() {
        return (
            <div className='register'>
                <h1>회원가입</h1>
                <input
                    type="text" 
                    name="username" 
                    value={this.state.username} 
                    onChange={this.handleInputChange} 
                    placeholder="아이디" 
                />
                <input 
                    type="password" 
                    name="password" 
                    value={this.state.password} 
                    onChange={this.handleInputChange} 
                    placeholder="비밀번호" 
                />
                <button onClick={this.handleRegisterClick}>회원가입</button>
            </div>
        );
    }
});

module.exports = Register;
