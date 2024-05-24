'use strict';

var React = require('react');

var Sidebar = React.createClass({
    handleNavigation(page) {
        this.props.onNavigate(page);
    },

    render() {
        return (
            <div className='sidebar'>
                <button onClick={() => this.handleNavigation('ChatApp')}>채팅</button>
                <button onClick={() => this.handleNavigation('MyPage')}>마이페이지</button>
            </div>
        );
    }
});

module.exports = Sidebar;
