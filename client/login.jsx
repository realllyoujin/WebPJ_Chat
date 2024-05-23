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
                this.props.onLoginSuccess(); //로그인 성공시 -> onLoginSuccess 동작.
            } else {
                alert('Login failed');
            }
        });
    },

    render() {
        return (
            <div className='login'>
                <h1> 로그인ㅎㅎ </h1>
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
            </div>
        );
    }
});

module.exports = Login;