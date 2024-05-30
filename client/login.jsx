'use strict';

var React = require('react');

var Login = React.createClass({
    getInitialState() {
        return {
            username: '',
            password: ''
        };
    },

    //input tag value를 state에 넣기!!
    handleInputChange(e) {
        const { name, value } = e.target;
        this.setState({ [name]: value });
    },

    //로그인 버튼 클릭시 동작
    handleLoginClick() {
        const { username, password } = this.state;
        
        //서버에 로그인 요청
        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.props.onLoginSuccess(username); //로그인 성공시 -> onLoginSuccess 동작.
            } else {
                alert('Login failed');
            }
        });
    },

    //회원가입 페이지로 이동
    handleRouteRegisterClick(){
        this.props.handleRouteRegister();
    },

    render() {
        return (
            <div className='login'>
                <h1> 🌸 Welocome to UNI Chat 😈🌸 </h1>
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
                <button onClick={this.handleLoginClick}>로그인</button>

                <button onClick={this.handleRouteRegisterClick}>회원가입</button>
            </div>
        );
    }
});

module.exports = Login;
