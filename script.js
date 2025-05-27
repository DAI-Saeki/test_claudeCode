class Tetris {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.ROWS = 20;
        this.COLS = 10;
        this.BLOCK_SIZE = 30;
        
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropTime = 0;
        this.dropInterval = 1000;
        this.gameRunning = false;
        this.gamePaused = false;
        
        this.colors = [
            '#000000', // empty
            '#FF0000', // I
            '#00FF00', // O
            '#0000FF', // T
            '#FFFF00', // S
            '#FF00FF', // Z
            '#00FFFF', // J
            '#FFA500'  // L
        ];
        
        this.tetrominoes = {
            'I': [
                [[0,0,0,0],
                 [1,1,1,1],
                 [0,0,0,0],
                 [0,0,0,0]]
            ],
            'O': [
                [[2,2],
                 [2,2]]
            ],
            'T': [
                [[0,3,0],
                 [3,3,3],
                 [0,0,0]],
                [[0,3,0],
                 [0,3,3],
                 [0,3,0]],
                [[0,0,0],
                 [3,3,3],
                 [0,3,0]],
                [[0,3,0],
                 [3,3,0],
                 [0,3,0]]
            ],
            'S': [
                [[0,4,4],
                 [4,4,0],
                 [0,0,0]],
                [[0,4,0],
                 [0,4,4],
                 [0,0,4]]
            ],
            'Z': [
                [[5,5,0],
                 [0,5,5],
                 [0,0,0]],
                [[0,0,5],
                 [0,5,5],
                 [0,5,0]]
            ],
            'J': [
                [[6,0,0],
                 [6,6,6],
                 [0,0,0]],
                [[0,6,6],
                 [0,6,0],
                 [0,6,0]],
                [[0,0,0],
                 [6,6,6],
                 [0,0,6]],
                [[0,6,0],
                 [0,6,0],
                 [6,6,0]]
            ],
            'L': [
                [[0,0,7],
                 [7,7,7],
                 [0,0,0]],
                [[0,7,0],
                 [0,7,0],
                 [0,7,7]],
                [[0,0,0],
                 [7,7,7],
                 [7,0,0]],
                [[7,7,0],
                 [0,7,0],
                 [0,7,0]]
            ]
        };
        
        this.initBoard();
        this.setupEventListeners();
        this.generateNextPiece();
    }
    
    initBoard() {
        this.board = Array(this.ROWS).fill().map(() => Array(this.COLS).fill(0));
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('pauseButton').addEventListener('click', () => this.togglePause());
        document.getElementById('resetButton').addEventListener('click', () => this.resetGame());
        document.getElementById('restartButton').addEventListener('click', () => this.restartGame());
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning || this.gamePaused) return;
        
        switch(e.code) {
            case 'ArrowLeft':
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                this.movePiece(0, 1);
                break;
            case 'ArrowUp':
                this.rotatePiece();
                break;
            case 'Space':
                e.preventDefault();
                this.togglePause();
                break;
        }
    }
    
    generateNextPiece() {
        const pieces = Object.keys(this.tetrominoes);
        const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
        const shapes = this.tetrominoes[randomPiece];
        
        this.nextPiece = {
            type: randomPiece,
            shape: shapes[0],
            rotation: 0,
            shapes: shapes
        };
        
        this.drawNext();
    }
    
    spawnPiece() {
        this.currentPiece = {
            ...this.nextPiece,
            x: Math.floor(this.COLS / 2) - Math.floor(this.nextPiece.shape[0].length / 2),
            y: 0
        };
        
        this.generateNextPiece();
        
        if (this.isColliding(this.currentPiece, 0, 0)) {
            this.gameOver();
        }
    }
    
    movePiece(dx, dy) {
        if (this.isColliding(this.currentPiece, dx, dy)) {
            if (dy > 0) {
                this.placePiece();
                this.clearLines();
                this.spawnPiece();
            }
            return;
        }
        
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;
    }
    
    rotatePiece() {
        const newRotation = (this.currentPiece.rotation + 1) % this.currentPiece.shapes.length;
        const newShape = this.currentPiece.shapes[newRotation];
        
        const tempPiece = {
            ...this.currentPiece,
            shape: newShape,
            rotation: newRotation
        };
        
        if (!this.isColliding(tempPiece, 0, 0)) {
            this.currentPiece.shape = newShape;
            this.currentPiece.rotation = newRotation;
        }
    }
    
    isColliding(piece, dx, dy) {
        const newX = piece.x + dx;
        const newY = piece.y + dy;
        
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col] !== 0) {
                    const boardX = newX + col;
                    const boardY = newY + row;
                    
                    if (boardX < 0 || boardX >= this.COLS || 
                        boardY >= this.ROWS || 
                        (boardY >= 0 && this.board[boardY][boardX] !== 0)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    placePiece() {
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col] !== 0) {
                    const boardX = this.currentPiece.x + col;
                    const boardY = this.currentPiece.y + row;
                    
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.shape[row][col];
                    }
                }
            }
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let row = this.ROWS - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                this.board.splice(row, 1);
                this.board.unshift(Array(this.COLS).fill(0));
                linesCleared++;
                row++;
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += this.calculateScore(linesCleared);
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 50);
            this.updateDisplay();
        }
    }
    
    calculateScore(linesCleared) {
        const baseScore = [0, 100, 300, 500, 800];
        return baseScore[linesCleared] * this.level;
    }
    
    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        this.spawnPiece();
        this.gameLoop();
        
        document.getElementById('startButton').disabled = true;
        document.getElementById('pauseButton').disabled = false;
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        if (!this.gamePaused) {
            this.gameLoop();
        }
        
        document.getElementById('pauseButton').textContent = this.gamePaused ? '再開' : '一時停止';
    }
    
    resetGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropTime = 0;
        this.dropInterval = 1000;
        
        this.initBoard();
        this.generateNextPiece();
        this.updateDisplay();
        this.draw();
        
        document.getElementById('startButton').disabled = false;
        document.getElementById('pauseButton').disabled = true;
        document.getElementById('pauseButton').textContent = '一時停止';
        document.getElementById('gameOver').classList.add('hidden');
    }
    
    restartGame() {
        this.resetGame();
        this.startGame();
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').classList.remove('hidden');
        
        document.getElementById('startButton').disabled = false;
        document.getElementById('pauseButton').disabled = true;
    }
    
    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;
        
        const now = Date.now();
        if (now - this.dropTime > this.dropInterval) {
            this.movePiece(0, 1);
            this.dropTime = now;
        }
        
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    draw() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawBoard();
        if (this.currentPiece) {
            this.drawPiece();
        }
        this.drawGrid();
    }
    
    drawBoard() {
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.board[row][col] !== 0) {
                    this.ctx.fillStyle = this.colors[this.board[row][col]];
                    this.ctx.fillRect(
                        col * this.BLOCK_SIZE,
                        row * this.BLOCK_SIZE,
                        this.BLOCK_SIZE,
                        this.BLOCK_SIZE
                    );
                }
            }
        }
    }
    
    drawPiece() {
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col] !== 0) {
                    this.ctx.fillStyle = this.colors[this.currentPiece.shape[row][col]];
                    this.ctx.fillRect(
                        (this.currentPiece.x + col) * this.BLOCK_SIZE,
                        (this.currentPiece.y + row) * this.BLOCK_SIZE,
                        this.BLOCK_SIZE,
                        this.BLOCK_SIZE
                    );
                }
            }
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 1;
        
        for (let row = 0; row <= this.ROWS; row++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, row * this.BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, row * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
        
        for (let col = 0; col <= this.COLS; col++) {
            this.ctx.beginPath();
            this.ctx.moveTo(col * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(col * this.BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
    }
    
    drawNext() {
        this.nextCtx.fillStyle = '#000000';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        const blockSize = 20;
        const shape = this.nextPiece.shape;
        const offsetX = (this.nextCanvas.width - shape[0].length * blockSize) / 2;
        const offsetY = (this.nextCanvas.height - shape.length * blockSize) / 2;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] !== 0) {
                    this.nextCtx.fillStyle = this.colors[shape[row][col]];
                    this.nextCtx.fillRect(
                        offsetX + col * blockSize,
                        offsetY + row * blockSize,
                        blockSize,
                        blockSize
                    );
                }
            }
        }
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const tetris = new Tetris();
});