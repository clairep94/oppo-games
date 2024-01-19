/// <reference types="cypress" />

describe('Tictactoe Info Page', () => {
  beforeEach(() => {
    // Set the viewport
    cy.viewport('macbook-16')

    // Clear cookies before each test
    cy.clearCookies();
    cy.visit('http://localhost:3000/tictactoe')
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
  it("should have a header 'Tic Tac Toe'", () => {
    cy.get("h1").should('have.text', 'Tic-Tac-Toe')
  })

  it("should have a background corresponding to the game", () => {
    cy.get(`[data-cy=background-image]`)
    .invoke('css', 'background-image')
    .should('include', 'TTT');
  })

  it("should have an image corresponding to the game'", () => {
    cy.get('[data-cy=tic-tac-toe-info-card] img')
    .should('have.attr', 'src')
    .and('include', 'tic-tac-toe-header-image');
  })


  it("should a description for the game", () => {
    const gameDescription = `Engage in a riveting duel of minds on the alpine map with Tic Tac Toe, where strategy takes center stage and every move is a live-wire decision! Feel the strategic intensity as you plot your moves, contemplating each placement with the precision of a seasoned tactician. Explore the dynamic nature of the game, where strategic brilliance meets real-time decision-making. Will you corner your opponent with a cunning move, or will they surprise you with an unexpected counter?`
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
