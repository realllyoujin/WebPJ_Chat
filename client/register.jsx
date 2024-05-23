var React = require('react');

var Register = React.createClass({
    getInitialState() {
        return {
            username: '',
            password: '',
            confirmPassword: ''
        };
    },

    handleInputChange(e) {
        const { name, value } = e.target;
        this.setState({ [name]: value });
    },

    handleRegisterClick() {
        const { username, password, confirmPassword } = this.state;

        if (password !== confirmPassword) {
            alert('비밀번호가 일치하지않습니다!😡');
            return;
        }

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
                alert('회원가입을 축하합니다.👏🏻👏🏻👏🏻');
                this.props.onRegisterSuccess();
            } else {
                alert(`Registration failed: ${data.message}`);
            }
        });
    },

    render() {
        return (
            <div className='register'>
                <h1>회원가입 테스트^^</h1>
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
                <input
                    type="password"
                    name="confirmPassword"
                    value={this.state.confirmPassword}
                    onChange={this.handleInputChange}
                    placeholder="비밀번호 확인"
                />
                <button onClick={this.handleRegisterClick}>회원가입</button>
            </div>
        );
    }
});

module.exports = Register;
