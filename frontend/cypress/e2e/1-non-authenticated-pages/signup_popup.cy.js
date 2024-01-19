/// <reference types="cypress" />

describe("Signing up through the landing page popup", () => {
  beforeEach(() => {
    // Set the viewport
    cy.viewport('macbook-16')

    // Clear local storage and cookies before each test
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit('http://localhost:3000/')

    // Open the sign up/login popup div
    cy.get('button').click()

    // Click to the sign in portion through "register"
    cy.get("#register-link").click()

  })

  // ============= CONTENTS ================ //

  it("Should have a Signup form with an 'Username', 'Email', 'Password' and 'Retype Password' field, and a submit button", () => {
    // Ensure the signup popup is visible
    cy.get('#login-signup-popup').should('be.visible');
  
    // Check the header text within any descendant element
    cy.get('#login-signup-popup').contains('Sign Up').should('exist');
  
    // Check for the presence and attributes of form fields
    cy.get("#username").should('exist').and('have.attr', 'placeholder', 'Username');
    cy.get("#email").should('exist').and('have.attr', 'placeholder', 'Email');
    cy.get("#password").should('exist').and('have.attr', 'placeholder', 'Password').and('have.attr', 'type', 'password');
    cy.get("#retype-password").should('exist').and('have.attr', 'placeholder', 'Retype Password').and('have.attr', 'type', 'password');
    cy.get("#toggle-pw-visibility-button").should('exist').and('have.text', "Show Password");
    cy.get("#error-message").should('not.exist'); // Assuming error message is initially not visible
    cy.get("#success-message").should('not.exist'); // Assuming error message is initially not visible

  });

  it("Should have a 'Show Password' link to toggle visibility that shows the password when you click", () => {
    // changing it to show password
    cy.get("#toggle-pw-visibility-button").click()
    cy.get("#toggle-pw-visibility-button").should('have.text', "Hide Password");
    cy.get("#password").should('exist').and('have.attr', 'placeholder', 'Password').and('have.attr', 'type', 'text');
    cy.get("#retype-password").should('exist').and('have.attr', 'placeholder', 'Retype Password').and('have.attr', 'type', 'text');
  
    // changing it back
    cy.get("#toggle-pw-visibility-button").click()
    cy.get("#toggle-pw-visibility-button").should('have.text', "Show Password");
    cy.get("#password").should('exist').and('have.attr', 'placeholder', 'Password').and('have.attr', 'type', 'password');
    cy.get("#retype-password").should('exist').and('have.attr', 'placeholder', 'Retype Password').and('have.attr', 'type', 'password');
  })

  it("Should have a link to change to form to login", () => {
    cy.get("#log-in-link").should('exist').and('have.text', 'Log in')
    cy.get("#log-in-link").click()
    cy.get('#login-signup-popup').contains('Login').should('exist');
  })

  it("Should have an x to close the popup", () => {
    cy.get("[data-cy=close-div-x]").should('exist').and('have.text', 'X')
    cy.get("[data-cy=close-div-x]").click()
    cy.get('#login-signup-popup').should('not.exist');
  })

  // ============= ERROR HANDLING ================ //

  it("When not all fields are filled, it shows an error message", () => {
    const fillFieldsError = "All fields must be filled"

    cy.get("#email").type("someone@example.com");
    cy.get("#password").type("password");
    cy.get("#submit").click();
    cy.get("#error-message").should('exist').and('have.text', fillFieldsError)

  })

  it("When using an invalid username, it shows an error message", () => {
    const invalidUsernameError = "Username must have at least 6 characters and must not include any spaces or special characters"
  
    cy.get("#username").type("123 ")
    cy.get("#email").type("someone@example.com");
    cy.get("#password").type("password");
    cy.get("#retype-password").type("password");
    cy.get("#submit").click();
    cy.get("#error-message").should('exist').and('have.text', invalidUsernameError)
  })

  it("When using an invalid email, it shows an error message", () => {
    const invalidEmailError = "Please enter a valid email address"

    cy.get("#username").type("user123")
    cy.get("#email").type("someone@com");
    cy.get("#password").type("password");
    cy.get("#retype-password").type("password");
    cy.get("#submit").click();
    cy.get("#error-message").should('exist').and('have.text', invalidEmailError)
  })

  it("When using an invalid password, it shows an error message", () => {
    const invalidPasswordError = "Password must have at least 8 characters with no spaces and must include at least 1 lowercase letter, 1 uppercase letter, 1 special character and 1 number"

    cy.get("#username").type("user123")
    cy.get("#email").type("someone@email.com");
    cy.get("#password").type("password");
    cy.get("#retype-password").type("password");
    cy.get("#submit").click();
    cy.get("#error-message").should('exist').and('have.text', invalidPasswordError)
  })

  it("When using an invalid password, it shows an error message", () => {
    const matchPasswordsError = "Passwords do not match"

    cy.get("#username").type("user123")
    cy.get("#email").type("someone@email.com");
    cy.get("#password").type("Password123@");
    cy.get("#retype-password").type("Password123!");
    cy.get("#submit").click();
    cy.get("#error-message").should('exist').and('have.text', matchPasswordsError)
  })


  // ============= MAIN FUNCTION: SIGN UP ================ //
  it("Upon successful signup, it should show you a success message prompting you to log in", () => {
    const successMessage = "Successfully signed up! Please log in."

    cy.get("#username").type("user1234")
    cy.get("#email").type("newuser@email.com");
    cy.get("#password").type("Password123@");
    cy.get("#retype-password").type("Password123@");
    cy.get("#submit").click();
    cy.get("#success-message").should('exist').and('have.text', successMessage)

  })




})