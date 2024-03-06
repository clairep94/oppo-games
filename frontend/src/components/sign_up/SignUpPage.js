import React, { useState } from 'react';
import styles from './SignUpForm.module.css';
import loginImg from "../../assets/bg-gaming-console-duo-animations.png"

const SignUpPage = ({ navigate }) => {

    // =========== STATE VARIABLES ==========================
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordHidden, setPasswordHidden] = useState(true);
  const [retypePassword, setRetypePassword] = useState("");
  const [error, setError] = useState(null);

  // ============ FORM SUBMISSION FOR SIGNUP ====================
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!username || !email || !password || !retypePassword) {
      setError("All fields must be filled"); 
      return;
    } else {
      setError("")
    }

    if (!isValidUsername(username)) {
      setError("Username must have at least 6 characters and must not include any spaces or special characters");
      return;
    } else {
      setError("");
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    } else {
      setError("");
    }

    if (!isValidPassword(password)) {
      setError("Password must have at least 8 characters with no spaces and must include at least 1 lowercase letter, 1 uppercase letter, 1 special character and 1 number");
      return;
    } else {
      setError("");
    }

    if (password !== retypePassword) {
      setError("Passwords do not match")
      return;
    } else {
      setError("")
    }
    

    fetch( '/signup', {
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

  const handleRetypePasswordChange = (event) => {
    setRetypePassword(event.target.value)
  }



  const bgGradient = "bg-gradient-to-br from-gray-900 via-customPurple to-customIndigo "
  const bgGradientDark = "bg-gradient-to-br from-gray-400 via-blue-400 to-purple-500 "
  const bgGradientLight = "bg-gradient-to-br from-customPink via-customIndigo to-customBlack "
  const h2Style = "pt-3 pb-3 text-7xl text-white font-extrabold"
  const buttonStyle = "w-2/5 bg-customPink text-xl text-white font-semibold rounded-lg py-2 px-4 hover:bg-pink-600 focus:outline-none focus:shadow-outline-pink active:bg-pink-700"
  const fieldStyle = "w-4/5 p-2 rounded-lg border-2 border-gray-300 flex-col"
  const fieldStyle2 = "w-2/5 p-2 rounded-lg border-2 border-gray-300 mr-1"


    return (
      <>
  <div className={`flex h-screen ${bgGradient}`}>

    {/* LEFT side with image */}
    <div className="flex-1 hidden lg:flex items-center justify-center w-1/2">
      <img src={loginImg} alt="Login Image" className="pl-20 flex-col justify-center"></img>
    </div>

    <div className="flex-1 pl-40 pr-40 pt-80 pb-80">
      <h2 className={h2Style}>Sign Up</h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        <input 
          aria-label="Username input field" 
          placeholder="Username" 
          id="username" 
          type='text' 
          value={ username } 
          onChange={handleUsernameChange}
          className={fieldStyle}
        />
        
        <input 
          aria-label="Email address input field" 
          placeholder="Email" 
          id="email" 
          type='text' 
          value={ email } 
          onChange={handleEmailChange}
          className={fieldStyle}
        />
        
        <input 
          aria-label="Password input field" 
          placeholder="Password" 
          id="password" 
          type={passwordHidden ? 'password': 'text'} 
          value={ password } 
          onChange={handlePasswordChange}
          className={fieldStyle2}
        />
        
        <input 
          aria-label="Retype password input field" 
          placeholder="Retype Password" 
          id="retype-password" 
          type={passwordHidden ? 'password': 'text'} 
          value={retypePassword} 
          onChange={handleRetypePasswordChange}
          className={fieldStyle2}
        />
        
        {/* BUTTON TO TOGGLE PW VISIBILITY */}
        <button
          className="text-sm text-white text-left underline mt-2 flex flex-col"
          onClick={handleSetPasswordHidden} 
          id="toggle-pw-visibility-button" 
          type="button" 
          aria-label="Toggle Password Visibility Button"
        >
          {passwordHidden ? 'Show Password' : 'Hide Password'}
        </button>
        
        <input 
          aria-label="Submit button" 
          id='submit' 
          type="submit" 
          value="Submit"
          className={buttonStyle}
        />
        
      </form>

      {/* ERROR MESSAGES */}
      {error && <p aria-label="Error Message" className={styles.errorMessage}>{error}</p>}

      <br/>

      <p 
      aria-label="Already have an account? Log in" 
      className="mt-4 text-white text-left">Already have an account? <a 
      aria-label="Link to Log in" 
      href="/login" 
      className="underline">Log in</a>
      </p>
    </div>
  </div>
</>

    
    );
}

function isValidPassword(password) {
  // Password must have at least 8 characters with no spaces and must include at least 1 lowercase letter, 1 uppercase letter, 1 special character and 1 number
  const passwordRegex = /^(?!.*\s)(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})(?=.*[a-z])(?=.*[A-Z])/;
  return passwordRegex.test(password);
}

function isValidUsername(username) {
  //Username must have at least 6 characters and must not include any spaces or special characters
  const usernameRegex = /^[a-zA-Z0-9]{6,}$/;
  return usernameRegex.test(username);
}

/* Email must comply with the following criteria set out in line with the email address standards (RFC 5321 and RFC 5322):
no spaces
a single @ sign
maximum 64 characters before the @ sign
only certain accepted characters before the @ sign
maximum 255 characters after the @ sign
the top-level domain (TLD) e.g. .com .org should be a valid and recognised TLD*/
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+)*@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}


export default SignUpPage;
