/// <reference types="cypress" />

describe('Battleships Info Page', () => {
  beforeEach(() => {
    // Set the viewport
    cy.viewport('macbook-16')

    // Clear cookies before each test
    cy.clearCookies();
    cy.visit('http://localhost:3000/battleships')
  })

  // MINI-NAVBAR
  it("should have a 'Oppo Games' button that redirects you to '/welcome'", () => {
    cy.get(`[data-cy=oppo-games-button]`).should('have.text', "OPPO GAMES")
    cy.get(`[data-cy=oppo-games-button]`).click()

    // Verify the redirection to "/welcome"
    cy.url().should('include', '/welcome');
  })

  it("should have a 'Log in' button that redirects you to '/login'", () => {
    cy.get(`[data-cy=log-in-button]`).should('have.text', "Log in")
    cy.get(`[data-cy=log-in-button]`).click()

    // Verify the redirection to "/login"
    cy.url().should('include', '/login');
  })

  it("should have a 'Sign Up' button that redirects you to '/signup'", () => {
    cy.get(`[data-cy=sign-up-button]`).should('have.text', "Sign Up")
    cy.get(`[data-cy=sign-up-button]`).click()

    // Verify the redirection to "/signup"
    cy.url().should('include', '/signup');
  })

  // PAGE CONTENTS ===========
  it("should have a header 'Battleships'", () => {
    cy.get("h1").should('have.text', 'Battleships')
  })

  it("should have a background corresponding to the game", () => {
    cy.get(`[data-cy=background-image]`)
    .invoke('css', 'background-image')
    .should('include', 'BS2');
  })

  it("should have an image corresponding to the game'", () => {
    cy.get('[data-cy=battleships-info-card] img')
    .should('have.attr', 'src')
    .and('include', 'battleships_show');
  })


  it("should a description for the game", () => {
    const gameDescription = 'Embark on an exhilarating game of Battleships, where strategic cunning takes center stage! Experience the thrill of simultaneous moves in our concealed information gaming system. Engage in a battle of wits as you carefully plan your maneuvers, ensuring your opponent remains in the dark until both moves are executed. With the element of surprise, each player must anticipate and outsmart their adversary. To dive into the heart-pounding action, simply log in and hit the play button below.' 
    +" For those not yet part of our gaming community, you'll be seamlessly redirected to the login screen, inviting you to join and unlock a world of diverse games and lively player interactions. Get ready to set sail into the strategic depths of Battleships!"

    cy.get("[data-cy=game-description]").should('have.text', gameDescription)
  })

  // OTHER GAMES ========
  it("should have a second header for 'EXPLORE OUR LATEST GAMES'", () => {
    cy.get('h2').should('have.text', 'EXPLORE OUR LATEST GAMES')
  })

  // RPS CARD
  it("should have a 'Rock Paper Scissors' card that leads you to the Rock Paper Scissors about page", () => {
    cy.get('[data-cy=rock-paper-scissors-info-card]').should('exist')

    // Check that the "RPS" card has the specific img
    cy.get('[data-cy=rock-paper-scissors-info-card] img')
    .should('have.attr', 'src')
    .and('include', 'RPS');

    // Verify the redirection to "/rps"
    cy.get('[data-cy=rock-paper-scissors-info-card]').click()
    cy.url().should('include', '/rps');
  })

  // TTT CARD
  it("should have a 'Tic Tac Toe' card that leads you to the Battleships about page", () => {
    cy.get('[data-cy=tic-tac-toe-info-card]').should('exist')

    // Check that the "Tic Tac Toe" card has the specific img
    cy.get('[data-cy=tic-tac-toe-info-card] img')
    .should('have.attr', 'src')
    .and('include', 'TTT');

    // Verify the redirection to "/tictactoe"
    cy.get('[data-cy=tic-tac-toe-info-card]').click()
    cy.url().should('include', '/tictactoe');
  })

})
