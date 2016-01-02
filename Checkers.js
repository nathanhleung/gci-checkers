class Checkers {
  constructor(selector, options) {
    this.selector = selector;
    this.options = options;
    if (typeof this.options.pieces === "undefined") {
      this.options.pieces = {};
    }
    if (typeof this.options.squares === "undefined") {
      this.options.squares = {};
    }
    this.board = Checkers.generateBoard(this.options.size || Checkers.defaults.size);
    this.resetPieces();
    /**
     * Key:
     * Red is 1
     * Black is -1
     * Nothing is 0
     */
    this.turn = "red";
    this.render();
  }
  static generateBoard(size) {
    let board = [];
    for (let row = 0; row < size; row++) {
      board.push([]);
      for (let square = 0; square < size; square++) {
        board[row].push(0);
      }
    }
    return board;
  }
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
      if (this.selected) {
        this.deselectPiece();
      }
    })
  }
  render() {
    this.generateHTML();
    this.applyStyles();
    this.addEventListeners();
  }
  rerender() {
    $(this.selector).empty();
    this.render();
  }
  selectPiece(target) {
    this.selected = $(target).get(0);
    this.selected.parentNode.style.backgroundColor = "#888";
  }
  deselectPiece() {
    this.selected.parentNode.style.backgroundColor = "black";
    this.selected = "";
  }
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
  canMove(target) {
    if (this.selected && target.dataset.piece === "0") {
      let selectedPos = JSON.parse(this.selected.parentNode.dataset.position);
      let targetPos = JSON.parse(target.dataset.position);
      // Black goes up, red goes down
      let selectedPiece = this.selected.parentNode.dataset.piece;
      if (selectedPiece === "1" || selectedPiece === "-1") {
        if (this.turn === "black") {
          if (selectedPos[0] - targetPos[0] === 1 && Math.abs(selectedPos[1] - targetPos[1]) === 1) {
            return true;
          }
          if (selectedPos[0] - targetPos[0] === 2 && Math.abs(selectedPos[1] - targetPos[1]) === 2) {
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
  canMoveAgain(position) {
    // Double jump support?
    // Coming soon
  }
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
  showWinMessage() {
    $(this.selector).empty();
    this.generateHTML();
    this.applyStyles();
    $(this.selector + ' .game-message').html("The winner is " + this.winner + ".");
  }
}

// Since ES6 doesn't have static property support
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
