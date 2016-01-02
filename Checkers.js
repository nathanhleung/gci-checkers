"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Checkers = (function () {
  function Checkers(selector, options) {
    _classCallCheck(this, Checkers);

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

  _createClass(Checkers, [{
    key: "resetPieces",
    value: function resetPieces() {
      for (var row in this.board) {
        for (var square in this.board[row]) {
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
  }, {
    key: "generateHTML",
    value: function generateHTML() {
      $(this.selector).append("\n      <p class=\"game-message\">\n        <span>It's <strong>" + this.turn + "'s</strong> turn.</span>\n      </p>\n      <br>\n    ");
      var table = document.createElement("table");
      table.className = "checkersBoard";
      for (var row in this.board) {
        var tr = document.createElement("tr");
        var trWithSquares = this.generateSquares(tr, row);
        table.appendChild(trWithSquares);
      }
      $(this.selector).append(table);
    }
  }, {
    key: "applyStyles",
    value: function applyStyles() {
      var _this = this;

      // getElementsByClassName returns HTMLCollection, not array, so forEach doesn't exist as a method on it
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
  }, {
    key: "generateSquares",
    value: function generateSquares(tr, row) {
      for (var square in this.board[row]) {
        var td = document.createElement("td");
        td.dataset.piece = this.board[row][square];
        td.dataset.position = "[" + row + "," + square + "]";
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
  }, {
    key: "placePiece",
    value: function placePiece(td) {
      // Data attributes are always strings
      if (td.dataset.piece !== "0") {
        var piece = document.createElement("div");
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
  }, {
    key: "addEventListeners",
    value: function addEventListeners() {
      var _this2 = this;

      if (this.turn === "red") {
        $('.piece-red').click(function (event) {
          if (_this2.selected) {
            _this2.deselectPiece();
          }
          _this2.selectPiece(event.target);
          // Stop propagation to document handler (deselect all)
          event.stopPropagation();
        });
      } else if (this.turn === "black") {
        $('.piece-black').click(function (event) {
          if (_this2.selected) {
            _this2.deselectPiece();
          }
          _this2.selectPiece(event.target);
          event.stopPropagation();
        });
      }
      $('.square-black').click(function (event) {
        _this2.movePiece(event.target);
        event.stopPropagation();
      });
      $(document).click(function () {
        if (_this2.selected) {
          _this2.deselectPiece();
        }
      });
    }
  }, {
    key: "render",
    value: function render() {
      this.generateHTML();
      this.applyStyles();
      this.addEventListeners();
    }
  }, {
    key: "rerender",
    value: function rerender() {
      $(this.selector).empty();
      this.render();
    }
  }, {
    key: "selectPiece",
    value: function selectPiece(target) {
      this.selected = $(target).get(0);
      this.selected.parentNode.style.backgroundColor = "#888";
    }
  }, {
    key: "deselectPiece",
    value: function deselectPiece() {
      this.selected.parentNode.style.backgroundColor = "black";
      this.selected = "";
    }
  }, {
    key: "movePiece",
    value: function movePiece(target) {
      if (this.canMove(target)) {
        // Force from string to number (dataset is a string)
        var selectedVal = JSON.parse(this.selected.parentNode.dataset.piece);
        var selectedPos = JSON.parse(this.selected.parentNode.dataset.position);
        var targetPos = JSON.parse(target.dataset.position);
        this.board[selectedPos[0]][selectedPos[1]] = 0;
        this.board[targetPos[0]][targetPos[1]] = selectedVal;
        // Check if we're moving two rows up or down, then kill the middle piece
        if (Math.abs(selectedPos[0] - targetPos[0]) === 2) {
          var averagePos = [(selectedPos[0] + targetPos[0]) / 2, (selectedPos[1] + targetPos[1]) / 2];
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
  }, {
    key: "canMove",
    value: function canMove(target) {
      if (this.selected && target.dataset.piece === "0") {
        var selectedPos = JSON.parse(this.selected.parentNode.dataset.position);
        var targetPos = JSON.parse(target.dataset.position);
        // Black goes up, red goes down
        var selectedPiece = this.selected.parentNode.dataset.piece;
        if (selectedPiece === "1" || selectedPiece === "-1") {
          if (this.turn === "black") {
            if (selectedPos[0] - targetPos[0] === 1 && Math.abs(selectedPos[1] - targetPos[1]) === 1) {
              return true;
            }
            if (selectedPos[0] - targetPos[0] === 2 && Math.abs(selectedPos[1] - targetPos[1]) === 2) {
              var averagePos = [(selectedPos[0] + targetPos[0]) / 2, (selectedPos[1] + targetPos[1]) / 2];
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
              var averagePos = [(selectedPos[0] + targetPos[0]) / 2, (selectedPos[1] + targetPos[1]) / 2];
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
            var averagePos = [(selectedPos[0] + targetPos[0]) / 2, (selectedPos[1] + targetPos[1]) / 2];
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
  }, {
    key: "canMoveAgain",
    value: function canMoveAgain(position) {
      // Double jump support?
      // Coming soon
    }
  }, {
    key: "crownKings",
    value: function crownKings() {
      for (var square in this.board[0]) {
        if (this.board[0][square] === -1) {
          this.board[0][square] = -2;
        }
      }
      for (var square in this.board[this.board.length - 1]) {
        if (this.board[this.board.length - 1][square] === 1) {
          this.board[this.board.length - 1][square] = 2;
        }
      }
    }
  }, {
    key: "checkWinners",
    value: function checkWinners() {
      var redCounter = 0;
      var blackCounter = 0;
      for (var row in this.board) {
        for (var square in this.board[row]) {
          if (this.board[row][square] === 1) {
            redCounter++;
          } else if (this.board[row][square] == -1) {
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
  }, {
    key: "showWinMessage",
    value: function showWinMessage() {
      $(this.selector).empty();
      this.generateHTML();
      this.applyStyles();
      $(this.selector + ' .game-message').html("The winner is " + this.winner + ".");
    }
  }], [{
    key: "generateBoard",
    value: function generateBoard(size) {
      var board = [];
      for (var row = 0; row < size; row++) {
        board.push([]);
        for (var square = 0; square < size; square++) {
          board[row].push(0);
        }
      }
      return board;
    }
  }]);

  return Checkers;
})();

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
};

var checkers = new Checkers('#checkersApp', {
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