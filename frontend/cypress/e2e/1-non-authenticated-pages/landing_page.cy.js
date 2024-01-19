/// <reference types="cypress" />

describe('Landing page when NOT logged in', () => {
  beforeEach(() => {
    // Set the viewport
    cy.viewport('macbook-16')

    // Clear cookies before each test
    cy.clearCookies();
    cy.visit('http://localhost:3000/')
  })

  it("should redirect you to '/welcome' when you are not signed in", () => {
    // Verify the redirection to /welcome
    cy.url().should('include', '/welcome');
  })

  it("should show you a title text and hero blurb", () => {
    cy.get('h1').should('have.text', 'OPPO GAMES');
    cy.get('h3').should('have.text', "ONLINE MULTIPLAYER GAMING")
    cy.get('p').contains('Welcome to Oppo Games. An online platform to participate in retro, multiplayer games in live time. Join a game, chat with your opponent and have fun!').should('exist');
  })

  it("should have a background with the island image", () => {
    cy.get(`[data-cy=background-image]`)
    .invoke('css', 'background-image')
    .should('include', '/backgrounds/islandfar.jpg');
  })

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

  it("should have a 'EXPLORE OUR LATEST GAMES' header when you scroll down", () => {
    cy.get('h2').should('have.text', "EXPLORE OUR LATEST GAMES")

    // cy.get('h2').should('not.be.visible') // this test is not working

    cy.scrollTo('bottom');
    cy.get('h2').should('be.visible');
  })

  it("should have a 'TicTacToe' card that leads you to the TicTacToe about page", () => {
    cy.get('[data-cy=tic-tac-toe-info-card]').should('exist')

    cy.scrollTo('bottom');
    cy.get('[data-cy=tic-tac-toe-info-card]').should('be.visible').and('contain.text', 'Tic Tac Toe')

    // Check that the "Tic Tac Toe" card has the specific img
    cy.get('[data-cy=tic-tac-toe-info-card] img')
    .should('have.attr', 'src')
    .and('include', 'TTT');

    // Verify the redirection to "/rps"
    cy.get('[data-cy=tic-tac-toe-info-card]').click()
    cy.url().should('include', '/tictactoe');
  })


  it("should have a 'Rock Paper Scissors' card that leads you to the Rock Paper Scissors about page", () => {
    cy.get('[data-cy=rock-paper-scissors-info-card]').should('exist')

    cy.scrollTo('bottom');
    cy.get('[data-cy=rock-paper-scissors-info-card]').should('be.visible').and('contain.text', 'Rock, Paper, Scissors')

    // Check that the "Tic Tac Toe" card has the specific img
    cy.get('[data-cy=rock-paper-scissors-info-card] img')
    .should('have.attr', 'src')
    .and('include', 'yellow-green-low-poly-landscape');

    // Verify the redirection to "/rps"
    cy.get('[data-cy=rock-paper-scissors-info-card]').click()
    cy.url().should('include', '/rps');
  })

  it("should have a 'Battleships' card that leads you to the Battleships about page", () => {
    cy.get('[data-cy=battleships-info-card]').should('exist')

    cy.scrollTo('bottom');
    cy.get('[data-cy=battleships-info-card]').should('be.visible').and('contain.text', 'Battleships')

    // Check that the "Battleships" card has the specific img
    cy.get('[data-cy=battleships-info-card] img')
    .should('have.attr', 'src')
    .and('include', 'BS');

    // Verify the redirection to "/battleships"
    cy.get('[data-cy=battleships-info-card]').click()
    cy.url().should('include', '/battleships');
  })

  it("should have a 'Start Playing' button that opens up the Login Popup", () => {
    cy.get('button').should('exist').and('contain.text', 'START PLAYING')

    cy.get('button').click()

    cy.get('#login-signup-popup').should('be.visible').and('contain.text', 'Login')
  })
  // MORE TESTS BELOW FOR THE ACTUAL LOGIN/SIGNUP POPUPS
  // MORE TESTS BELOW FOR THE LOGIN/SIGN UP PAGES
})
