'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* global $:false, _:false */

/**
 * Creates a new checkers game
 * @param selector - Selector to put the game inside
 * @param [options] - Options for the game (colors, size, etc)
 * @class
 */

var Checkers = function () {
  function Checkers(selector, options, socket) {
    _classCallCheck(this, Checkers);

    this.selector = selector;
    this.socket = socket || undefined;
    this.options = _.defaultsDeep(options || {}, Checkers.defaults);
    this.board = this.options.board || Checkers.generateBoard(this.options.size);
    this.resetPieces();
    // Red goes first
    this.turn = 'red';
    this.render();
  }
  /**
   * Generates an empty board
   * @param {number} size - The size of the board to generate
   */


  _createClass(Checkers, [{
    key: 'resetPieces',

    /**
     * Creates the initial layout of pieces
     * A red piece is 1, a black piece is -1
     * A red king is 2, a black king is -2
     * An empty square is 0
     */
    value: function resetPieces() {
      for (var i = 0; i < this.board.length; i++) {
        var row = i;
        for (var j = 0; j < this.board[row].length; j++) {
          var square = j;
          if (row < 3) {
            if (row % 2 === 0) {
              if (square % 2 === 0) {
                this.board[row][square] = 1;
              }
            } else {
              if (square % 2 === 1) {
                this.board[row][square] = 1;
              }
            }
          } else if (row > this.board.length - 4) {
            if (row % 2 === 1) {
              if (square % 2 === 1) {
                this.board[row][square] = -1;
              }
            } else {
              if (square % 2 === 0) {
                this.board[row][square] = -1;
              }
            }
          }
        }
      }
    }
    /**
     * Generates HTML from the current state of the board
     */

  }, {
    key: 'generateHTML',
    value: function generateHTML() {
      var turnString = void 0;
      if (this.turn === this.options.player) {
        turnString = 'your (' + this.turn + '\'s)';
      } else {
        turnString = 'your opponent\'s (' + this.turn + '\'s)';
      }
      $(this.selector).append('\n      <p class="game-message">\n        <span>It\'s <strong>' + turnString + '</strong> turn.</span>\n      </p>\n      <br>\n    ');
      var table = document.createElement('table');
      table.className = 'checkersBoard';
      for (var i = 0; i < this.board.length; i++) {
        var row = i;
        var tr = document.createElement('tr');
        var trWithSquares = this.generateSquares(tr, row);
        table.appendChild(trWithSquares);
      }
      $(this.selector).append(table);
    }
    /**
     * Applies the colors that were provided in the options object
     */

  }, {
    key: 'applyStyles',
    value: function applyStyles() {
      var _this = this;

      // getElementsByClassName returns HTMLCollection, not array,
      // so forEach doesn't exist as a method on it
      [].forEach.call(document.getElementsByClassName('square-red'), function (el) {
        el.style.backgroundColor = _this.options.squares.red || Checkers.defaults.squares.red;
      });
      [].forEach.call(document.getElementsByClassName('square-black'), function (el) {
        el.style.backgroundColor = _this.options.squares.black || Checkers.defaults.squares.black;
      });
      [].forEach.call(document.getElementsByClassName('piece-red'), function (el) {
        el.style.backgroundColor = _this.options.pieces.red || Checkers.defaults.pieces.red;
      });
      [].forEach.call(document.getElementsByClassName('piece-black'), function (el) {
        el.style.backgroundColor = _this.options.pieces.black || Checkers.defaults.pieces.black;
      });
    }
    /**
     * Generates a row of squares (tr elements) based on the current state of the board
     * @param {HTMLElement} tr - The <tr> to generate squares for
     * @param {number} row - The row on the board
     */

  }, {
    key: 'generateSquares',
    value: function generateSquares(tr, row) {
      for (var i = 0; i < this.board[row].length; i++) {
        var square = i;
        var td = document.createElement('td');
        td.dataset.piece = this.board[row][square];
        td.dataset.position = '[' + row + ',' + square + ']';
        if (row % 2 === 0) {
          if (square % 2 === 0) {
            td.className = 'square-black';
          } else {
            td.className = 'square-red';
          }
        } else {
          if (square % 2 === 0) {
            td.className = 'square-red';
          } else {
            td.className = 'square-black';
          }
        }
        var tdWithPiece = this.placePiece(td);
        tr.appendChild(tdWithPiece);
      }
      return tr;
    }
    /**
     * Places a piece on a square based on the state of the square
     * @param {HTMLElement} td - The <td> to append the piece to
     */

  }, {
    key: 'placePiece',
    value: function placePiece(td) {
      // Data attributes are always strings
      if (td.dataset.piece !== '0') {
        var piece = document.createElement('div');
        if (td.dataset.piece === '1') {
          piece.className = 'piece piece-red';
        } else if (td.dataset.piece === '2') {
          piece.className = 'piece piece-red piece-king';
        } else if (td.dataset.piece === '-1') {
          piece.className = 'piece piece-black';
        } else if (td.dataset.piece === '-2') {
          piece.className = 'piece piece-black piece-king';
        }
        td.appendChild(piece);
      }
      return td;
    }
    /**
     * Reapplies event listeners to elements based on current turn.
     * Event listeners are cleared after every re-render, since the container <div> is emptied.
     */

  }, {
    key: 'addEventListeners',
    value: function addEventListeners() {
      var _this2 = this;

      if (this.turn === 'red' && this.options.player === 'red') {
        $('.piece-red').click(function (event) {
          if (_this2.selectedPos) {
            _this2.deselectPiece();
          }
          var targetPos = JSON.parse($(event.target).parent()[0].dataset.position);
          _this2.selectPiece(targetPos);
          // Stop propagation to document handler (deselect all)
          event.stopPropagation();
        });
      } else if (this.turn === 'black' && this.options.player === 'black') {
        $('.piece-black').click(function (event) {
          if (_this2.selectedPos) {
            _this2.deselectPiece();
          }
          var targetPos = JSON.parse($(event.target).parent()[0].dataset.position);
          _this2.selectPiece(targetPos);
          event.stopPropagation();
        });
      }
      $('.square-black').click(function (event) {
        // If we have a selection, then we can move
        if (_this2.selectedPos) {
          _this2.movePiece(JSON.parse(event.target.dataset.position));
        }
        event.stopPropagation();
      });
      $(document).click(function (event) {
        // Deselect piece if there's a click that's not on a square
        if (_this2.selectedPos) {
          _this2.deselectPiece();
        }
      });
    }
    /**
     * Groups together render functions
     */

  }, {
    key: 'render',
    value: function render() {
      this.generateHTML();
      this.applyStyles();
      this.addEventListeners();
    }
    /**
     * Same as render(), but empties the container div
     */

  }, {
    key: 'rerender',
    value: function rerender() {
      $(this.selector).empty();
      this.render();
    }
    /**
     * Check if a piece can be selected
     * @param {Number[2]} targetPos - the coordinates of the selection
     */

  }, {
    key: 'canSelect',
    value: function canSelect(targetPos) {
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
     * Select a piece to be moved
     * @param {HTMLElement} target - the HTML element of the piece
     */

  }, {
    key: 'selectPiece',
    value: function selectPiece(targetPos) {
      if (this.canSelect(targetPos)) {
        console.log('yo');
        this.selectedPos = targetPos;
        $('[data-position="' + JSON.stringify(this.selectedPos) + '"]').css('background-color', '#888');
      }
    }
    /**
     * Deselect a previously selected piece
     */

  }, {
    key: 'deselectPiece',
    value: function deselectPiece() {
      $('[data-position="' + JSON.stringify(this.selectedPos) + '"]').css('background-color', 'black');
      this.selectedPos = '';
    }
    /**
     * Move a piece
     * @param {HTMLElement} target - the square to be moved to
     */

  }, {
    key: 'movePiece',
    value: function movePiece(targetPos) {
      if (this.canMove(targetPos)) {
        if (this.socket) {
          this.socket.emit('move', {
            initial: this.selectedPos,
            target: targetPos
          });
        }
        // Force from string to number (dataset is a string)
        var selectedVal = JSON.parse($('[data-position="' + JSON.stringify(this.selectedPos) + '"]')[0].dataset.piece);
        this.board[this.selectedPos[0]][this.selectedPos[1]] = 0;
        this.board[targetPos[0]][targetPos[1]] = selectedVal;
        // Check if we're moving two rows up or down, then kill the middle piece
        if (Math.abs(this.selectedPos[0] - targetPos[0]) === 2) {
          var averagePos = [(this.selectedPos[0] + targetPos[0]) / 2, (this.selectedPos[1] + targetPos[1]) / 2];
          // Kill the middle piece
          this.board[averagePos[0]][averagePos[1]] = 0;
        }
        this.crownKings();
        this.winner = this.checkWinners();
        if (this.winner === 'none') {
          if (this.turn === 'red') {
            this.turn = 'black';
          } else {
            this.turn = 'red';
          }
          this.rerender();
        } else {
          this.showWinMessage();
        }
        this.deselectPiece();
      }
    }
    /**
     * Checks if the planned move is valid
     * @param {HTMLElement} target - the planned square to move to
     * @todo This method is long - should be cleaned up
     */

  }, {
    key: 'canMove',
    value: function canMove(targetPos) {
      // Checks if there's a selected piece, and that there is no piece in the target element
      var targetPiece = this.board[targetPos[0]][targetPos[1]];
      if (this.selectedPos && targetPiece === 0) {
        // Black goes up, red goes down
        var selectedPiece = $('[data-position="' + JSON.stringify(this.selectedPos) + '"]').parent()[0].dataset.piece;
        if (this.turn === 'black') {
          if (this.selectedPos[0] - targetPos[0] === 1 && Math.abs(this.selectedPos[1] - targetPos[1]) === 1) {
            return true;
          }
          if (this.selectedPos[0] - targetPos[0] === 2 && Math.abs(this.selectedPos[1] - targetPos[1]) === 2) {
            // The averagePos is the square that's being jumped over
            var averagePos = [(this.selectedPos[0] + targetPos[0]) / 2, (this.selectedPos[1] + targetPos[1]) / 2];
            // 1 is red, -1 is black, 2 is red king, -2 is black king
            if (this.board[averagePos[0]][averagePos[1]] > 0) {
              return true;
            }
          }
        } else if (this.turn === 'red') {
          if (this.selectedPos[0] - targetPos[0] === -1 && Math.abs(this.selectedPos[1] - targetPos[1]) === 1) {
            return true;
          }
          if (this.selectedPos[0] - targetPos[0] === -2 && Math.abs(this.selectedPos[1] - targetPos[1]) === 2) {
            var _averagePos = [(this.selectedPos[0] + targetPos[0]) / 2, (this.selectedPos[1] + targetPos[1]) / 2];
            // 1 is red, -1 is black, 2 is red king, -2 is black king
            if (this.board[_averagePos[0]][_averagePos[1]] < 0) {
              return true;
            }
          }
        }
        if (selectedPiece === '2' || selectedPiece === '-2') {
          if (Math.abs(this.selectedPos[0] - targetPos[0]) === 1 && Math.abs(this.selectedPos[1] - targetPos[1]) === 1) {
            return true;
          }
          if (Math.abs(this.selectedPos[0] - targetPos[0]) === 2 && Math.abs(this.selectedPos[1] - targetPos[1]) === 2) {
            var _averagePos2 = [(this.selectedPos[0] + targetPos[0]) / 2, (this.selectedPos[1] + targetPos[1]) / 2];
            // 1 is red, -1 is black, 2 is red king, -2 is black king
            if (this.turn === 'red') {
              if (this.board[_averagePos2[0]][_averagePos2[1]] < 0) {
                return true;
              }
            } else if (this.turn === 'black') {
              if (this.board[_averagePos2[0]][_averagePos2[1]] > 0) {
                return true;
              }
            }
          }
        }
      }
      return false;
    }
    /**
     * Checks if one can move again (for double jumps)
     * @param {number[2]} position - the position of the last moved piece
     * @todo
     */

  }, {
    key: 'canMoveAgain',
    value: function canMoveAgain(position) {}
    // Double jump support?
    // Coming soon

    /**
     * Checks if any pieces have reached their respective opposite sides
     * and applies king status to them
     */

  }, {
    key: 'crownKings',
    value: function crownKings() {
      for (var square in this.board[0]) {
        if (this.board[0][square] === -1) {
          this.board[0][square] = -2;
        }
      }
      for (var _square in this.board[this.board.length - 1]) {
        if (this.board[this.board.length - 1][_square] === 1) {
          this.board[this.board.length - 1][_square] = 2;
        }
      }
    }
    /**
     * Checks if anyone has won yet
     */

  }, {
    key: 'checkWinners',
    value: function checkWinners() {
      var redCounter = 0;
      var blackCounter = 0;
      for (var i = 0; i < this.board.length; i++) {
        var row = i;
        for (var j = 0; j < this.board[row].length; j++) {
          var square = j;
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
    /**
     * Shows the winner message
     */

  }, {
    key: 'showWinMessage',
    value: function showWinMessage() {
      $(this.selector).empty();
      this.generateHTML();
      this.applyStyles();
      $(this.selector + ' .game-message').html('The winner is ' + this.winner + '.');
    }
  }], [{
    key: 'generateBoard',
    value: function generateBoard(size) {
      var board = [];
      // Create rows
      for (var row = 0; row < size; row++) {
        board.push([]);
        // Create squares, each with value 0 (no piece)
        for (var square = 0; square < size; square++) {
          board[row].push(0);
        }
      }
      return board;
    }
  }]);

  return Checkers;
}();

// Since ES6 doesn't have static property support
/**
 * Default options for a new instance of Checkers
 */


Checkers.defaults = {
  size: 8,
  squares: {
    red: 'red',
    black: 'black'
  },
  pieces: {
    red: 'red',
    black: '#aaa'
  }
};