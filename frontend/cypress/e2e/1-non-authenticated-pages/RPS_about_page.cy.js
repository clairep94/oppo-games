/// <reference types="cypress" />

describe('Rock Paper Scissors Info Page', () => {
  beforeEach(() => {
    // Set the viewport
    cy.viewport('macbook-16')

    // Clear cookies before each test
    cy.clearCookies();
    cy.visit('http://localhost:3000/rps')
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
  it("should have a header 'Rock Paper Scissors'", () => {
    cy.get("h1").should('have.text', 'Rock, Paper, Scissors')
  })

  it("should have a background corresponding with the game", () => {
    cy.get(`[data-cy=background-image]`)
    .invoke('css', 'background-image')
    .should('include', 'RPS');
  })

  it("should have an image corresponding to the game'", () => {
    cy.get('[data-cy=rock-paper-scissors-info-card] img')
    .should('have.attr', 'src')
    .and('include', 'rock-papaer-scissors-header');
  })


  it("should a description for the game", () => {
    const gameDescription = `Simultaneous moves? How does that work? With our hidden information game system, you can be sure that your opponent won't see what you're up to before they have to make their best move - and stick with it. If you're logged in, click the button below to start a new Rock Paper Scissors game and be redirected to its page. If you're not logged in, it will redirect you to the login screen, where you can create an account to play all the different games on our website and chat with other players.`
    cy.get("[data-cy=game-description]").should('have.text', gameDescription)
  })

  // OTHER GAMES ========
  it("should have a second header for 'EXPLORE OUR LATEST GAMES'", () => {
    cy.get('h2').should('have.text', 'EXPLORE OUR LATEST GAMES')
  })

  // TICTACTOE CARD
  it("should have a 'Tic-Tac-Toe' card that leads you to the TTT about page", () => {
    cy.get('[data-cy=tic-tac-toe-info-card]').should('exist')

    // Check that the "RPS" card has the specific img
    cy.get('[data-cy=tic-tac-toe-info-card] img')
    .should('have.attr', 'src')
    .and('include', 'TTT');

    // Verify the redirection to "/tictactoe"
    cy.get('[data-cy=tic-tac-toe-info-card]').click()
    cy.url().should('include', '/tictactoe');
  })

  // BATTLESHIPS CARD
  it("should have a 'Battleships' card that leads you to the Battleships about page", () => {
    cy.get('[data-cy=battleships-info-card]').should('exist')

    // Check that the "Battleships" card has the specific img
    cy.get('[data-cy=battleships-info-card] img')
    .should('have.attr', 'src')
    .and('include', 'BS2');

    // Verify the redirection to "/battleships"
    cy.get('[data-cy=battleships-info-card]').click()
    cy.url().should('include', '/battleships');
  })

})
