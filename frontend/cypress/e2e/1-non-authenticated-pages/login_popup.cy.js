/// <reference types="cypress" />



describe("Logging in through the landing page popup", () => {
  beforeEach(() => {
    // TODO amend this signup command
    // cy.signup("user@email.com", "12345678")

    // Set the viewport
    cy.viewport('macbook-16')

    // Clear cookies before each test
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit('http://localhost:3000/')

    // Open the sign up/login popup div
    cy.get("[data-cy=start-button]").click()

  })

  // ============= CONTENTS ================ //
  it("Should have a Login form with an 'email' and 'password' field and button to toggle visibilty for the password", () => {
    cy.get('#login-signup-popup').should('be.visible').and('contain.text', 'Login')

    // Check for the presence and attributes of form fields
    // cy.get("#username").should('exist').and('have.attr', 'placeholder', 'Username');
    cy.get("#email").should('exist').and('have.attr', 'placeholder', 'Email');
    cy.get("#password").should('exist').and('have.attr', 'placeholder', 'Password').and('have.attr', 'type', 'password');
    // cy.get("#retype-password").should('exist').and('have.attr', 'placeholder', 'Retype Password').and('have.attr', 'type', 'password');
    cy.get("#toggle-pw-visibility-button").should('exist').and('have.text', "Show Password");
    cy.get("#error-message").should('not.exist'); // Assuming error message is initially not visible
  })

  it("Should have a 'Show Password' link to toggle visibility that shows the password when you click", () => {
    cy.get("#toggle-pw-visibility-button").should('have.text', "Show Password");

    // changing it to show password
    cy.get("#toggle-pw-visibility-button").click()
    cy.get("#toggle-pw-visibility-button").should('have.text', "Hide Password");
    cy.get("#password").should('exist').and('have.attr', 'placeholder', 'Password').and('have.attr', 'type', 'text');
  
    // changing it back
    cy.get("#toggle-pw-visibility-button").click()
    cy.get("#toggle-pw-visibility-button").should('have.text', "Show Password");
    cy.get("#password").should('exist').and('have.attr', 'placeholder', 'Password').and('have.attr', 'type', 'password');
  })

  it("Should have a link to change to form to register", () => {
    cy.get("#register-link").should('exist').and('have.text', 'Register')
    cy.get("#register-link").click()
    cy.get('#login-signup-popup').contains('Sign Up').should('exist');
  })

  it("Should have an x to close the popup", () => {
    cy.get("[data-cy=close-div-x]").should('exist').and('have.text', 'X')
    cy.get("[data-cy=close-div-x]").click()
    cy.get('#login-signup-popup').should('not.exist');
  })

  // ============= ERROR HANDLING ================ //

  it("With invalid credentials, it shows an error message 'wrong email or password combination' ", () => {
    const invalidLoginError = "Enter a valid email or password"

    cy.get("#email").type("someone@example.com");
    cy.get("#password").type("password");
    cy.get("#login-button").click();

    cy.get("#error-message").should('exist').and('have.text', invalidLoginError)
  })

  // ============= MAIN FUNCTION ================ //

  it("With valid credentials, redirects to '/' ", () => {
    cy.get("#email").type("newuser@email.com");
    cy.get("#password").type("Password123@");
    cy.get("#login-button").click();

    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/');
    });

  })



})

