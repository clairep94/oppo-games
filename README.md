# OppoGames

This is my personal extension of the [Oppo Games - Group 6 final project at Makers Academy](https://github.com/clairep94/oppo-games-group6).

![Screenshot 2024-01-12 at 02 33 41](https://github.com/clairep94/fp_team6_battleships/assets/128436909/1bd288a9-7537-4ca7-9165-0f002f89bb73)

OppoGames is a fullstack social-gaming site, showcasing use of the MERN stack, Socket.io and Tailwind CSS.

Users can sign up, log in, and play a number of mini-games 1v1 with other users. Users can see their opponents moves in real-time.

![Screenshot 2024-01-12 at 05 27 24](https://github.com/clairep94/fp_team6_battleships/assets/128436909/ef000121-91e2-40d4-a5ae-e8da95a4dca4)
![Screenshot 2024-01-12 at 05 27 34](https://github.com/clairep94/fp_team6_battleships/assets/128436909/7c1f3a23-fbeb-4e99-8214-46dae82ed911)

![Screenshot 2024-01-12 at 02 33 27](https://github.com/clairep94/fp_team6_battleships/assets/128436909/2bcdacd7-bb84-4a46-8f2e-48f1d63fce17)
![Screenshot 2024-01-12 at 02 39 48](https://github.com/clairep94/fp_team6_battleships/assets/128436909/bf185f59-b0ad-48ed-ab06-33cb96de69e6)
![Screenshot 2024-01-12 at 02 41 23](https://github.com/clairep94/fp_team6_battleships/assets/128436909/230d9fec-a425-4393-9c41-8f31ceefe6c4)



## Installing Project Dependencies:

### Node.js
1. Install Node Version Manager (nvm)
   ```
   brew install nvm
   ```
   Then follow the instructions to update your `~/.bash_profile`.
2. Open a new terminal
3. Install the latest version of [Node.js](https://nodejs.org/en/), currently `18.1.0`.
   ```
   nvm install 18
   ```

### MongoDB
1. Install MongoDB
   ```
   brew tap mongodb/brew
   brew install mongodb-community@5.0
   ```
   *Note:* If you see a message that says `If you need to have mongodb-community@5.0 first in your PATH, run:`, follow the instruction. Restart your terminal after this.
2. Start MongoDB
   ```
   brew services start mongodb-community@5.0
   ```

### Packages:
1. npm install in the three main folders:

   ``` shell
   ; cd api
   ; npm install
   ; cd ../frontend
   ; npm install
   ; cd ../socket
   ; npm install
   ```

# Running the App:

1. Start the server application (in the `api` directory)

   ```shell
   ; cd api
   ; JWT_SECRET=f6d278bb34e1d0e146a80b16ec254c05 npm start
   ```

2. Start the front end application (in the `frontend` directory)

  In a new terminal session...

  ```shell
  ; cd frontend
  ; npm start
  ```

You should now be able to open your browser and go to `http://localhost:3000/`

3. Start the socket (in the `socket` directory)

   In a new terminal session...

```shell
; cd socket
; npm start
```



<!---


## Quickstart

### Install Node.js

1. Install Node Version Manager (NVM)
   ```
   brew install nvm
   ```
   Then follow the instructions to update your `~/.bash_profile`.
2. Open a new terminal
3. Install the latest version of [Node.js](https://nodejs.org/en/), currently `18.1.0`.
   ```
   nvm install 18
   ```

### Set up your project

1. Fork this repository
2. Rename your fork to `acebook-<team name>`
3. Clone your fork to your local machine
4. Install Node.js dependencies for both the `frontend` and `api` directories.
   ```
   ; cd api
   ; npm install
   ; cd ../frontend
   ; npm install
   ```

> You might get warning messages about the installed dependencies at this point. You can ignore them, as long as the installation process doesn't fail. If the setup fails at this point, don't wait for too long and reach out to your coach.

5. Install an ESLint plugin for your editor. For example: [`linter-eslint`](https://github.com/AtomLinter/linter-eslint) for Atom.
6. Install MongoDB
   ```
   brew tap mongodb/brew
   brew install mongodb-community@5.0
   ```
   *Note:* If you see a message that says `If you need to have mongodb-community@5.0 first in your PATH, run:`, follow the instruction. Restart your terminal after this.
7. Start MongoDB
   ```
   brew services start mongodb-community@5.0
   ```

### How to run the server and use the app (as a human)

1. Start the server application (in the `api` directory)

  **Note the use of an environment variable for the JWT secret**

   ```
   ; cd api
   ; JWT_SECRET=f6d278bb34e1d0e146a80b16ec254c05 npm start
   ```
2. Start the front end application (in the `frontend` directory)

  In a new terminal session...

  ```
  ; cd frontend
  ; npm start
  ```

You should now be able to open your browser and go to `http://localhost:3000/signup` to create a new user.

Then, after signing up, you should be able to log in by going to `http://localhost:3000/login`.

After logging in, you won't see much but you can create posts using PostMan and they should then show up in the browser if you refresh the page.

### How to run automated tests

The automated tests run by sending actual HTTP requests to the API. Therefore, before anything, you'll need to start the backend server in test mode (so that it connects to the test DB).

**Note the use of an environment variable for the JWT secret**

```bash
# Make sure you're in the api directory
; cd api

; JWT_SECRET=f6d278bb34e1d0e146a80b16ec254c05 npm run start:test
```

You should leave this running in a terminal.

Then, you can either run tests for the backend or the frontend following the steps below. 

#### Running tests for the backend

Run the tests in a new terminal session:

```bash
# Make sure you're in the api directory
; cd api

; JWT_SECRET=f6d278bb34e1d0e146a80b16ec254c05 npm run test
```

**Note: On first run of test suite, you must run the test twice before they pass. This is because the the test database is created and written during these initial test runs.**Mon

####  Running tests for the frontend

Start the front end in a new terminal session

```bash
# Make sure you're in the frontend directory
; cd frontend

; JWT_SECRET=f6d278bb34e1d0e146a80b16ec254c05 npm start
```

Then run the tests in a new terminal session

```bash
# Make sure you're in the frontend directory
; cd frontend

; JWT_SECRET=f6d278bb34e1d0e146a80b16ec254c05 npm run test
```

## MongoDB Connection Errors?

Some people occasionally experience MongoDB connection errors when running the tests or trying to use the application. Here are some tips which might help resolve such issues.

- Check that MongoDB is installed using `mongo --version`
- Check that it's running using `brew services list`

If you have issues that are not resolved by these tips, please reach out to a coach and, once the issue is resolved, we can add a new tip!

## Documentation

[More documentation of the codebase and its architecture can be found here.](./DOCUMENTATION.md) It's recommended you all read this _after making sure the whole setup below worked for everyone_. Then work together on a diagram describing how the application works.

[A template Miro board for your diagrams can be found here.](https://miro.com/app/board/uXjVPqNzFfc=/?share_link_id=360271550320) Make sure your validate your diagrams with your coach. --->
