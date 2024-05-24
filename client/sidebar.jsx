'use strict';

var React = require('react');

var Sidebar = React.createClass({
    handleNavigate(page) {
        this.props.onNavigate(page);
    },

    render() {
        return (
            <div className='sidebar'>
                <button onClick={() => this.handleNavigate('ChatApp')}>채팅</button>
                <button onClick={() => this.handleNavigate('MyPage')}>마이페이지</button>
            </div>
        );
    }
});

module.exports = Sidebar;
