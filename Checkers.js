/**
 * Creates a new checkers game
 * @param selector - Selector to put the game inside
 * @param [options] - Options for the game (colors, size, etc)
 * @class
 */
class Checkers {
  constructor(selector, options) {
    this.selector = selector;
    this.options = options;
    // So a "can't read property x of undefined" error doesn't pop up
    if (typeof this.options.pieces === "undefined") {
      this.options.pieces = {};
    }
    if (typeof this.options.squares === "undefined") {
      this.options.squares = {};
    }
    this.board = Checkers.generateBoard(this.options.size || Checkers.defaults.size);
    this.resetPieces();
    // Red goes first
    this.turn = "red";
    this.render();
  }
  /**
   * Generates an empty board
   * @param {number} size - The size of the board to generate
   */
  static generateBoard(size) {
    let board = [];
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
  resetPieces() {
    for (let row in this.board) {
      for (let square in this.board[row]) {
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
  generateHTML() {
    $(this.selector).append(`
      <p class="game-message">
        <span>It's <strong>${this.turn}'s</strong> turn.</span>
      </p>
      <br>
    `);
    let table = document.createElement("table");
    table.className = "checkersBoard";
    for (let row in this.board) {
      let tr = document.createElement("tr");
      let trWithSquares = this.generateSquares(tr, row);
      table.appendChild(trWithSquares);
    }
    $(this.selector).append(table);
  }
  /**
   * Applies the colors that were provided in the options object
   */
  applyStyles() {
    // getElementsByClassName returns HTMLCollection, not array, so forEach doesn't exist as a method on it
    [].forEach.call(document.getElementsByClassName('square-red'), (el) => {
      el.style.backgroundColor = this.options.squares.red || Checkers.defaults.squares.red;
    });
    [].forEach.call(document.getElementsByClassName('square-black'), (el) => {
      el.style.backgroundColor = this.options.squares.black || Checkers.defaults.squares.black;
    });
    [].forEach.call(document.getElementsByClassName('piece-red'), (el) => {
      el.style.backgroundColor = this.options.pieces.red || Checkers.defaults.pieces.red;
    });
    [].forEach.call(document.getElementsByClassName('piece-black'), (el) => {
      el.style.backgroundColor = this.options.pieces.black || Checkers.defaults.pieces.black;
    });
  }
  /**
   * Generates a row of squares (tr elements) based on the current state of the board
   * @param {HTMLElement} tr - The <tr> to generate squares for
   * @param {number} row - The row on the board
   */
  generateSquares(tr, row) {
    for (let square in this.board[row]) {
      let td = document.createElement("td");
      td.dataset.piece = this.board[row][square];
      td.dataset.position = `[${row},${square}]`;
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
      let tdWithPiece = this.placePiece(td);
      tr.appendChild(tdWithPiece);
    }
    return tr;
  }
  /**
   * Places a piece on a square based on the state of the square
   * @param {HTMLElement} td - The <td> to append the piece to
   */
  placePiece(td) {
    // Data attributes are always strings
    if (td.dataset.piece !== "0") {
      let piece = document.createElement("div");
      if (td.dataset.piece === "1") {
        piece.className = "piece piece-red";
      } else if (td.dataset.piece === "2") {
        piece.className = "piece piece-red piece-king";
      } else if (td.dataset.piece === "-1") {
        piece.className = "piece piece-black";
      } else if (td.dataset.piece === "-2") {
        piece.className = "piece piece-black piece-king";
      }
      td.appendChild(piece);
    }
    return td;
  }
  /**
   * Reapplies event listeners to elements based on current turn.
   * Event listeners are cleared after every re-render, since the container <div> is emptied.
   */
  addEventListeners() {
    if (this.turn === "red") {
      $('.piece-red').click((event) => {
        if (this.selected) {
          this.deselectPiece();
        }
        this.selectPiece(event.target);
        // Stop propagation to document handler (deselect all)
        event.stopPropagation();
      }); 
    } else if (this.turn === "black") {
      $('.piece-black').click((event) => {
        if (this.selected) {
          this.deselectPiece();
        }
        this.selectPiece(event.target);
        event.stopPropagation();
      });
    }
    $('.square-black').click((event) => {
      this.movePiece(event.target);
      event.stopPropagation();
    });
    $(document).click(() => {
      // Deselect piece if there's a click that's not on a square
      if (this.selected) {
        this.deselectPiece();
      }
    })
  }
  /**
   * Groups together render functions
   */
  render() {
    this.generateHTML();
    this.applyStyles();
    this.addEventListeners();
  }
  /**
   * Same as render(), but empties the container div
   */
  rerender() {
    $(this.selector).empty();
    this.render();
  }
  /**
   * Select a piece to be moved
   * @param {HTMLElement} target - the HTML element of the piece
   */
  selectPiece(target) {
    this.selected = $(target).get(0);
    this.selected.parentNode.style.backgroundColor = "#888";
  }
  /**
   * Deselect a previously selected piece
   */
  deselectPiece() {
    this.selected.parentNode.style.backgroundColor = "black";
    this.selected = "";
  }
  /**
   * Move a piece
   * @param {HTMLElement] target - the square to be moved to
   */
  movePiece(target) {
    if (this.canMove(target)) {
      // Force from string to number (dataset is a string)
      let selectedVal = JSON.parse(this.selected.parentNode.dataset.piece);
      let selectedPos = JSON.parse(this.selected.parentNode.dataset.position);
      let targetPos = JSON.parse(target.dataset.position);
      this.board[selectedPos[0]][selectedPos[1]] = 0;
      this.board[targetPos[0]][targetPos[1]] = selectedVal;
      // Check if we're moving two rows up or down, then kill the middle piece
      if (Math.abs(selectedPos[0] - targetPos[0]) === 2) {
        let averagePos = [(selectedPos[0] + targetPos[0]) / 2, (selectedPos[1] + targetPos[1]) / 2];
        // Kill the middle piece
        this.board[averagePos[0]][averagePos[1]] = 0;
      }
      this.crownKings();
      this.winner = this.checkWinners();
      if (this.winner === "none") {
        if (this.turn === "red") {
          this.turn = "black";
        } else {
          this.turn = "red";
        }
        this.rerender();
      } else {
        this.showWinMessage();
      }
    }
  }
  /**
   * Checks if the planned move is valid
   * @param {HTMLElement} target - the planned square to move to
   * @todo This method is long - should be cleaned up
   */
  canMove(target) {
    // Checks if there's a selected piece, and that there is no piece in the target element
    if (this.selected && target.dataset.piece === "0") {
      let selectedPos = JSON.parse(this.selected.parentNode.dataset.position);
      let targetPos = JSON.parse(target.dataset.position);
      // Black goes up, red goes down
      let selectedPiece = this.selected.parentNode.dataset.piece;
      // @todo This if statement is redundant, since on a turn one can only select pieces of their color - fix this
      if (selectedPiece === "1" || selectedPiece === "-1") {
        if (this.turn === "black") {
          if (selectedPos[0] - targetPos[0] === 1 && Math.abs(selectedPos[1] - targetPos[1]) === 1) {
            return true;
          }
          if (selectedPos[0] - targetPos[0] === 2 && Math.abs(selectedPos[1] - targetPos[1]) === 2) {
            // The averagePos is the square that's being jumped over
            let averagePos = [(selectedPos[0] + targetPos[0]) / 2, (selectedPos[1] + targetPos[1]) / 2];
            // 1 is red, -1 is black, 2 is red king, -2 is black king
            if (this.board[averagePos[0]][averagePos[1]] > 0) {
              return true;
            }
          }
        } else if (this.turn === "red") {
          if (selectedPos[0] - targetPos[0] === -1 && Math.abs(selectedPos[1] - targetPos[1]) === 1) {
            return true;
          }
          if (selectedPos[0] - targetPos[0] === -2 && Math.abs(selectedPos[1] - targetPos[1]) === 2) {
            let averagePos = [(selectedPos[0] + targetPos[0]) / 2, (selectedPos[1] + targetPos[1]) / 2];
            // 1 is red, -1 is black, 2 is red king, -2 is black king
            if (this.board[averagePos[0]][averagePos[1]] < 0) {
              return true;
            }
          }
        }
      }
      if (selectedPiece === "2" || selectedPiece === "-2") {
        if (Math.abs(selectedPos[0] - targetPos[0]) === 1 && Math.abs(selectedPos[1] - targetPos[1]) === 1) {
          return true;
        }
        if (Math.abs(selectedPos[0] - targetPos[0]) === 2 && Math.abs(selectedPos[1] - targetPos[1]) === 2) {
          let averagePos = [(selectedPos[0] + targetPos[0]) / 2, (selectedPos[1] + targetPos[1]) / 2];
          // 1 is red, -1 is black, 2 is red king, -2 is black king
          if (this.turn === "red") {
            if (this.board[averagePos[0]][averagePos[1]] < 0) {
              return true;
            }
          } else if (this.turn === "black") {
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
   * Checks if one can move again (for double jumps)
   * @param {number[2]} position - the position of the last moved piece
   * @todo
   */
  canMoveAgain(position) {
    // Double jump support?
    // Coming soon
  }
  /**
   * Checks if any pieces have reached their respective opposite sides and applies king status to them
   */
  crownKings() {
    for (let square in this.board[0]) {
      if (this.board[0][square] === -1) {
        this.board[0][square] = -2;
      }
    }
    for (let square in this.board[this.board.length - 1]) {
      if  (this.board[this.board.length - 1][square] === 1) {
        this.board[this.board.length - 1][square] = 2;
      }
    }
  }
  /**
   * Checks if anyone has one yet
   */
  checkWinners() {
    let redCounter = 0;
    let blackCounter = 0;
    for (let row in this.board) {
      for (let square in this.board[row]) {
        if (this.board[row][square] === 1 || this.board[row][square] === 2) {
          redCounter++;
        } else if (this.board[row][square] == -1 || this.board[row][square] == -2) {
          blackCounter++;
        }
      }
    }
    if (redCounter === 0) {
      return "black";
    } else if (blackCounter === 0) {
      return "red";
    }
    return "none";
  }
  /**
   * Shows the winner message
   */
  showWinMessage() {
    $(this.selector).empty();
    this.generateHTML();
    this.applyStyles();
    $(this.selector + ' .game-message').html("The winner is " + this.winner + ".");
  }
}

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
}

/**
 * Create a new checkers game in the #checkersApp element
 */
let checkers = new Checkers('#checkersApp', {
  size: 8,
  squares: {
    red: 'tan',
    black: 'black'
  },
  pieces: {
    red: 'red',
    black: '#666'
  }
});
