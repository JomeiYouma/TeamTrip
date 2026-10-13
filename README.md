# BrainLink Party

Prototype of a party game for groups of friends, played in the browser. The interface is in French.

## How a game goes

1. One player creates a game and gets a 4-character code. A game takes 3 to 12 players.
2. Each round, a player sees the name of someone in the group and a category (object, colour, animal, music, place…) and writes what that person makes them think of.
3. The associations are then shown anonymously and everyone guesses who they are about or who wrote them, depending on the mode.
4. A correct guess is worth 10 points, with a bonus when several players think alike. The final screen shows the ranking.

Three game modes are available, and the host sets the categories, the time per round and the number of rounds.

## Status

This is a front-end prototype. The lobby, the rounds, the timer and the scoring work on one device. There is no server yet: joining with a code is simulated and the other players' answers are generated. The game state is kept in `localStorage`.

## Run it

Open `index.html` in a browser. There is nothing to install or build.

## Stack

HTML, Tailwind CSS (CDN), Lucide icons and vanilla JavaScript (`game.js`).
