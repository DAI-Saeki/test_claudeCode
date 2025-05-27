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
        
        this.pieceStyles = {
            0: { primary: '#000000', secondary: '#000000', accent: '#000000' }, // empty
            1: { primary: '#00BFFF', secondary: '#87CEEB', accent: '#E0F6FF' }, // I - Cyan
            2: { primary: '#FFD700', secondary: '#FFF8DC', accent: '#FFFACD' }, // O - Gold
            3: { primary: '#9932CC', secondary: '#DA70D6', accent: '#E6E6FA' }, // T - Purple
            4: { primary: '#32CD32', secondary: '#90EE90', accent: '#F0FFF0' }, // S - Green
            5: { primary: '#FF4500', secondary: '#FF6347', accent: '#FFE4E1' }, // Z - Red
            6: { primary: '#4169E1', secondary: '#6495ED', accent: '#F0F8FF' }, // J - Blue
            7: { primary: '#FF8C00', secondary: '#FFA500', accent: '#FFF8DC' }  // L - Orange
        };
        
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
        
        // Mobile touch controls
        document.getElementById('leftBtn').addEventListener('click', () => {
            if (this.gameRunning && !this.gamePaused) this.movePiece(-1, 0);
        });
        document.getElementById('rightBtn').addEventListener('click', () => {
            if (this.gameRunning && !this.gamePaused) this.movePiece(1, 0);
        });
        document.getElementById('downBtn').addEventListener('click', () => {
            if (this.gameRunning && !this.gamePaused) this.movePiece(0, 1);
        });
        document.getElementById('rotateBtn').addEventListener('click', () => {
            if (this.gameRunning && !this.gamePaused) this.rotatePiece();
        });
        
        // Prevent zoom on double tap for mobile controls
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
            }, { passive: false });
        });
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning || this.gamePaused) return;
        
        switch(e.code) {
            case 'ArrowLeft':
                e.preventDefault();
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.movePiece(0, 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
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
                    this.drawEnhancedBlock(
                        col * this.BLOCK_SIZE,
                        row * this.BLOCK_SIZE,
                        this.BLOCK_SIZE,
                        this.board[row][col]
                    );
                }
            }
        }
    }
    
    drawPiece() {
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col] !== 0) {
                    this.drawEnhancedBlock(
                        (this.currentPiece.x + col) * this.BLOCK_SIZE,
                        (this.currentPiece.y + row) * this.BLOCK_SIZE,
                        this.BLOCK_SIZE,
                        this.currentPiece.shape[row][col],
                        true // isActivepiece
                    );
                }
            }
        }
    }
    
    drawEnhancedBlock(x, y, size, colorIndex, isActivePiece = false) {
        const style = this.pieceStyles[colorIndex];
        const ctx = this.ctx;
        
        // Create gradient
        const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
        gradient.addColorStop(0, style.accent);
        gradient.addColorStop(0.3, style.secondary);
        gradient.addColorStop(1, style.primary);
        
        // Shadow effect for active pieces
        if (isActivePiece) {
            ctx.shadowColor = style.primary;
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        }
        
        // Main block
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, size, size);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Highlight on top and left
        ctx.fillStyle = style.accent;
        ctx.fillRect(x, y, size, 2); // top
        ctx.fillRect(x, y, 2, size); // left
        
        // Dark border on bottom and right
        ctx.fillStyle = style.primary;
        ctx.fillRect(x, y + size - 2, size, 2); // bottom
        ctx.fillRect(x + size - 2, y, 2, size); // right
        
        // Inner highlight
        ctx.fillStyle = style.secondary;
        ctx.fillRect(x + 2, y + 2, size - 4, 1); // inner top
        ctx.fillRect(x + 2, y + 2, 1, size - 4); // inner left
        
        // Outer border
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size, size);
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
                    this.drawEnhancedBlockNext(
                        offsetX + col * blockSize,
                        offsetY + row * blockSize,
                        blockSize,
                        shape[row][col]
                    );
                }
            }
        }
    }
    
    drawEnhancedBlockNext(x, y, size, colorIndex) {
        const style = this.pieceStyles[colorIndex];
        const ctx = this.nextCtx;
        
        // Create gradient
        const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
        gradient.addColorStop(0, style.accent);
        gradient.addColorStop(0.3, style.secondary);
        gradient.addColorStop(1, style.primary);
        
        // Main block
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, size, size);
        
        // Highlight on top and left
        ctx.fillStyle = style.accent;
        ctx.fillRect(x, y, size, 1); // top
        ctx.fillRect(x, y, 1, size); // left
        
        // Dark border on bottom and right
        ctx.fillStyle = style.primary;
        ctx.fillRect(x, y + size - 1, size, 1); // bottom
        ctx.fillRect(x + size - 1, y, 1, size); // right
        
        // Outer border
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size, size);
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