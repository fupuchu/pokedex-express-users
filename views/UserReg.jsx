var React = require('react');

class UserReg extends React.Component {
  render() {
    return (
	    	<div style={{ fontFamily: 'sans-serif'}}>
					<h2>{this.props.msg}</h2>
	    		<form action="/registernew" method="POST">
            <input name="first_name" placeholder="Your Name" type="text"/>
	    			<input name="email" type="text" placeholder="email" />
	    			<input name="password" type="text" placeholder="password"/>
	    			<input name="submit" type="submit" />
	    		</form>
	    	</div>
    );

  }
}

module.exports = UserReg;