import React, { useState } from 'react';
import loginImg from "../../assets/single-console-stand.png"
import { useLocation } from 'react-router-dom'; // use this for login-popup when timed-out
// import styles from './LoginForm.module.css'

const LogInForm = ({ navigate, viewWelcome, viewSignup }) => {

  // =========== STATE VARIABLES ==========================
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [passwordHidden, setPasswordHidden] = useState(true);



  const location = useLocation(); // use this for login-popup when timed-out



  // ============ FORM SUBMISSION FOR LOGIN ====================
  const handleSubmit = async (event) => {
    event.preventDefault();
    // Send POST request to '/tokens' endpoint
    let response = await fetch( '/tokens', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email, password: password })
    })

    // Checking the response status
    if(response.status === 401){ // wrong password
      setError("Enter a valid email or password")
    } else if (response.status !== 201) { // if error code is not 401 or 201, show server error
      setError("Server error, please try again later")
    } else { // login successful
      let data = await response.json()
      window.localStorage.setItem("token", data.token)
      

      // // TEMP: No timeout login popup:
      navigate('/')

      // FOR FUTURE USE IF HAVING TIMEOUT LOGIN POPUP:
      // // Check the current location and navigate accordingly
      // if (location.pathname === ('/welcome' || '/login')) {
      //   navigate('/');
      // } else {
      //   // 
      // }
      // window.location.reload(); // Necessary addition so that page after successful login if logging in after timed out
    }
  }



  // ------------ SUPPORTIVE FUNCTIONS: ----------------
  // FUNCTIONS FOR CHANGING STATE VARIABLES 
  const handleEmailChange = (event) => {
    setEmail(event.target.value)
  }

  const handlePasswordChange = (event) => {
    setPassword(event.target.value)
  }

  const handleSetPasswordHidden = (event) => {
    setPasswordHidden(!passwordHidden)
  }

  const solidborder = "border-solid border-2 border-indigo-400"
  // Enter a valid email or password


  // ========= JSX FOR THE UI OF THE COMPONENT =====================
  // for all styling: use className={styles.Button}

  // const bgGradient = "bg-gradient-to-br from-gray-900 via-customPurple to-customIndigo "
  // const bgGradientDark = "bg-gradient-to-br from-gray-900 via-customIndigo to-customPink "
  // const bgGradientLight = "bg-gradient-to-br from-customPink via-customIndigo to-customBlack "
  const h2Style = "pt-3 pb-3 text-7xl text-white font-extrabold"
  const buttonStyle = "w-2/5 bg-purple-900 text-xl text-white font-semibold rounded-lg py-2 px-4 hover:bg-purple-600 focus:outline-purple-900 focus:shadow-outline-purple-900 active:bg-emerald-700"
  const fieldStyle = "w-4/5 p-2 rounded-lg border-2 border-gray-300"
    return (
      <>
      {/* flex-1 p-[5rem] relative */}
      {/* RIGHT side with login form */}
      <div className="flex-1 p-[5rem] relative">
        <button data-cy="close-div-x"
          className="absolute top-[3rem] right-[3rem] text-white text-3xl cursor-pointer"
          onClick={viewWelcome}
        >
          X
        </button>      
        
      <h2 className={h2Style}>Login</h2>
      
      {/* LOGIN FORM */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          aria-label="Email Field" 
          placeholder='Email' 
          id="email" 
          type='text' 
          value={email} 
          onChange={handleEmailChange} 
          className={fieldStyle}
        />
        
        <input 
          aria-label="Password Field" 
          placeholder='Password' 
          id="password" 
          type={passwordHidden ? 'password': 'text'} 
          value={password} 
          onChange={handlePasswordChange} 
          className={fieldStyle}
        />

        <input 
          aria-label="Login Button" 
          role='login-button' 
          id='login-button' 
          type="submit" 
          value="Login" 
          className={buttonStyle}
        />
      </form>

      {/* BUTTON TO TOGGLE PW VISIBILITY */}
      <button 
        aria-label="Toggle Password Visibility Button"
        onClick={handleSetPasswordHidden}
        id="toggle-pw-visibility-button"
        type="button"
        className="text-sm text-white underline mt-2"
      >
        {passwordHidden ? 'Show Password' : 'Hide Password'}
      </button>

      {/* ERROR MESSAGES */}
      {error && <p id="error-message" aria-label="Login Error Message" className="text-red-500 mt-4">{error}</p>}

      {/* Register Link */}
      <p aria-label="Don't have an account? Register" className="mt-4 text-white">
        Don't have an account?{' '}
        <a id='register-link'
        aria-label="Link to Register" onClick={viewSignup} className="underline">Register</a>
      </p>
    </div>

  </>
    );
}

export default LogInForm;
