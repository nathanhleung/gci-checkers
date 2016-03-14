'use strict';

const crypto = require('crypto');
const Game = require('../models/Game');

// See https://stackoverflow.com/questions/30697036/socket-io-emit-events-firing-multiple-times
let socketInitialized = false;

exports.index = (req, res, io) => {
  if (!req.query.game) {
    const hash = crypto.createHash('sha256');
    hash.update(req.sessionID);

    const accessCode = hash.digest('hex');
    const gameData = JSON.stringify(
      Checkers.setPieces(Checkers.generateBoard(8))
    );

    const game = new Game({
      accessCode,
      gameData,
    });

    game.save().then((doc) => {
      res.redirect(`/?game=${doc.accessCode}`);
    }).catch((err) => {
      return res.send(err);
    });
  } else {
    Game.findOne({
      accessCode: req.query.game,
    }).then((game) => {
      if (!socketInitialized) {
        io.on('connection', (socket) => {
          socket.join(game.accessCode);
          const room = io.sockets.adapter.rooms[game.accessCode];
          io.to(game.accessCode).emit('connect_count', room.length);
          socket.on('disconnect', () => {
            io.to(game.accessCode).emit('connect_count', room.length);
          })
          socket.on('move', (data) => {
            const currentCheckers = new Checkers(JSON.parse(game.gameData), game.turn);
            try {
              const resultBoard = currentCheckers.movePiece(data.initial, data.target);
              game.gameData = JSON.stringify(resultBoard);
              if (game.turn === 'red') {
                game.turn === 'black';
              } else {
                game.turn === 'red';
              }
              game.save().then(() => {
                io.to(game.accessCode).emit('move', data);
              });
            } catch (err) {
              console.log(err);
            }
          })
        });
        socketInitialized = true;
      }
      res.render('index', {
        title: 'CheckersJS - Online Realtime Checkers',
        description: 'Play checkers online with CheckersJS',
        gameData: game.gameData,
      });
    }).catch((err) => {
      console.log('err', err);
      return res.send(err.toString());
    });
  }
};

/**
 * Creates a new checkers game
 * @param selector - Selector to put the game inside
 * @param [options] - Options for the game (colors, size, etc)
 * @class
 */
class Checkers {
  constructor(board, turn) {
    this.board = board;
    this.turn = turn;
  }
  /**
   * Generates an empty board
   * @param {number} size - The size of the board to generate
   */
  static generateBoard(size) {
    const board = [];
    // Create rows
    for (let row = 0; row < size; row++) {
      board.push([]);
      // Create squares, each with value 0 (no piece)
      for (let square = 0; square < size; square++) {
        board[row].push(0);
      }
    }
    return board;
  }
  /**
   * Creates the initial layout of pieces
   * A red piece is 1, a black piece is -1
   * A red king is 2, a black king is -2
   * An empty square is 0
   */
  static setPieces(board) {
    for (let i = 0; i < board.length; i++) {
      const row = i;
      for (let j = 0; j < board[row].length; j++) {
        const square = j;
        if (row < 3) {
          if (row % 2 === 0) {
            if (square % 2 === 0) {
              board[row][square] = 1;
            }
          } else {
            if (square % 2 === 1) {
              board[row][square] = 1;
            }
          }
        } else if (row > board.length - 4) {
          if (row % 2 === 1) {
            if (square % 2 === 1) {
              board[row][square] = -1;
            }
          } else {
            if (square % 2 === 0) {
              board[row][square] = -1;
            }
          }
        }
      }
    }
    return board;
  }
  /**
   * Move a piece
   * @param {HTMLElement} target - the square to be moved to
   */
  movePiece(initialPos, targetPos) {
    if (this.canMove(initialPos, targetPos)) {
      const selectedVal = this.board[initialPos[0]][initialPos[1]];
      this.board[initialPos[0]][initialPos[1]] = 0;
      this.board[targetPos[0]][targetPos[1]] = selectedVal;
      // Check if we're moving two rows up or down, then kill the middle piece
      if (Math.abs(initialPos[0] - targetPos[0]) === 2) {
        const averagePos =
          [(initialPos[0] + targetPos[0]) / 2, (initialPos[1] + targetPos[1]) / 2];
        // Kill the middle piece
        this.board[averagePos[0]][averagePos[1]] = 0;
      }
      this.crownKings();
      return this.board;
    } else {
      throw new Error('That\'s an invalid move!');
    }
  }
  /**
   * Checks if the planned move is valid
   * @param {HTMLElement} target - the planned square to move to
   * @todo This method is long - should be cleaned up
   */
  canMove(initialPos, targetPos) {
    // Checks if there's a selected piece, and that there is no piece in the target element
    const targetPiece = this.board[targetPos[0]][targetPos[1]];
    if (this.canSelect(initialPos) && targetPiece === 0) {
      // Black goes up, red goes down
      const selectedPiece = this.board[initialPos[0]][initialPos[1]];
      if (this.turn === 'black') {
        if (initialPos[0] - targetPos[0] === 1 &&
            Math.abs(initialPos[1] - targetPos[1]) === 1) {
          return true;
        }
        if (initialPos[0] - targetPos[0] === 2 &&
            Math.abs(initialPos[1] - targetPos[1]) === 2) {
          // The averagePos is the square that's being jumped over
          const averagePos =
            [(initialPos[0] + targetPos[0]) / 2, (initialPos[1] + targetPos[1]) / 2];
          // 1 is red, -1 is black, 2 is red king, -2 is black king
          if (this.board[averagePos[0]][averagePos[1]] > 0) {
            return true;
          }
        }
      } else if (this.turn === 'red') {
        if (initialPos[0] - targetPos[0] === -1 &&
            Math.abs(initialPos[1] - targetPos[1]) === 1) {
          return true;
        }
        if (initialPos[0] - targetPos[0] === -2 &&
            Math.abs(initialPos[1] - targetPos[1]) === 2) {
          const averagePos =
            [(initialPos[0] + targetPos[0]) / 2, (initialPos[1] + targetPos[1]) / 2];
          // 1 is red, -1 is black, 2 is red king, -2 is black king
          if (this.board[averagePos[0]][averagePos[1]] < 0) {
            return true;
          }
        }
      }
      if (selectedPiece === '2' || selectedPiece === '-2') {
        if (Math.abs(initialPos[0] - targetPos[0]) === 1 &&
            Math.abs(initialPos[1] - targetPos[1]) === 1) {
          return true;
        }
        if (Math.abs(initialPos[0] - targetPos[0]) === 2 &&
            Math.abs(initialPos[1] - targetPos[1]) === 2) {
          const averagePos =
            [(initialPos[0] + targetPos[0]) / 2, (initialPos[1] + targetPos[1]) / 2];
          // 1 is red, -1 is black, 2 is red king, -2 is black king
          if (this.turn === 'red') {
            if (this.board[averagePos[0]][averagePos[1]] < 0) {
              return true;
            }
          } else if (this.turn === 'black') {
            if (this.board[averagePos[0]][averagePos[1]] > 0) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }
  /**
   * Check if a piece can be selected
   * @param {Number[2]} targetPos - the coordinates of the selection
   */
  canSelect(targetPos) {
    if (this.turn === 'red') {
      if (this.board[targetPos[0]][targetPos[1]] === 1) {
        return true;
      }
    } else if (this.turn === 'black') {
      if (this.board[targetPos[0]][targetPos[1]] === -1) {
        return true;
      }
    }
    return false;
  }
  /**
   * Checks if any pieces have reached their respective opposite sides
   * and applies king status to them
   */
  crownKings() {
    for (const square in this.board[0]) {
      if (this.board[0][square] === -1) {
        this.board[0][square] = -2;
      }
    }
    for (const square in this.board[this.board.length - 1]) {
      if (this.board[this.board.length - 1][square] === 1) {
        this.board[this.board.length - 1][square] = 2;
      }
    }
  }
  /**
   * Checks if anyone has won yet
   */
  checkWinners() {
    let redCounter = 0;
    let blackCounter = 0;
    for (let i = 0; i < this.board.length; i++) {
      const row = i;
      for (let j = 0; j < this.board[row].length; j++) {
        const square = j;
        if (this.board[row][square] === 1 || this.board[row][square] === 2) {
          redCounter++;
        } else if (this.board[row][square] === -1 || this.board[row][square] === -2) {
          blackCounter++;
        }
      }
    }
    if (redCounter === 0) {
      return 'black';
    } else if (blackCounter === 0) {
      return 'red';
    }
    return 'none';
  }
}
