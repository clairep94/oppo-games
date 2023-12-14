import React, { useState } from 'react';

const SignUpForm = ({ navigate }) => {

    // =========== STATE VARIABLES ==========================
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordHidden, setPasswordHidden] = useState(true);

  // ============ FORM SUBMISSION FOR LOGIN ====================
  const handleSubmit = async (event) => {
    event.preventDefault();

    fetch( '/users', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: username, email: email, password: password })
    })
      .then(response => {
        if(response.status === 201) {
          navigate('/login')
        } else {
          navigate('/signup')
        }
      })
  }

  // ------------ SUPPORTIVE FUNCTIONS: ----------------
  // FUNCTIONS FOR CHANGING STATE VARIABLES 
  const handleUsernameChange = (event) => {
    setUsername(event.target.value)
  }
  
  const handleEmailChange = (event) => {
    setEmail(event.target.value)
  }

  const handlePasswordChange = (event) => {
    setPassword(event.target.value)
  }

  const handleSetPasswordHidden = (event) => {
    setPasswordHidden(!passwordHidden)
  }

    return (
      <>
      <form onSubmit={handleSubmit}>
          <input placeholder="Username" id="username" type='text' value={ username } onChange={handleUsernameChange} />
          <input placeholder="Email" id="email" type='text' value={ email } onChange={handleEmailChange} />
          <input placeholder="Password" id="password" type={passwordHidden ? 'password': 'text'} value={ password } onChange={handlePasswordChange} />
          <input id='submit' type="submit" value="Submit" />
      </form>

        {/* BUTTON TO TOGGLE PW VISIBILITY */}
        <button
        onClick={handleSetPasswordHidden}
        id="toggle-pw-visibility-button"
        button type="button"
        aria-label="Toggle Password Visibility Button"
        >
          {passwordHidden ? 'Show Password' : 'Hide Password'}
      </button>

      </>
    
    );
}

export default SignUpForm;
