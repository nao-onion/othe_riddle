// script.js
let boardSize;
let gameBoard;
let currentPlayer = 'black';
let uploadedImage = null;
let imageTimer = null;
let countdownInterval = null;

function startGame() {
    if (!document.getElementById('imageUpload').files[0]) {
        alert('画像をアップロードしてください');
        return;
    }

    boardSize = parseInt(document.getElementById('boardSize').value);
    
    const file = document.getElementById('imageUpload').files[0];
    processImage(file).then(processedImageUrl => {
        uploadedImage = processedImageUrl;
        document.getElementById('settingsScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'block';
        initializeBoard();
    });
}

function processImage(file) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const cellSize = 50;
            const padding = 10; // boardのパディング値
            const boardPixelSize = (cellSize * boardSize) + (padding * 2);
            
            canvas.width = boardPixelSize;
            canvas.height = boardPixelSize;
            const ctx = canvas.getContext('2d');

            let newWidth, newHeight;
            const aspectRatio = img.width / img.height;

            if (aspectRatio > 1) {
                newWidth = boardPixelSize;
                newHeight = boardPixelSize / aspectRatio;
            } else {
                newHeight = boardPixelSize;
                newWidth = boardPixelSize * aspectRatio;
            }

            const offsetX = (boardPixelSize - newWidth) / 2;
            const offsetY = (boardPixelSize - newHeight) / 2;

            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, boardPixelSize, boardPixelSize);
            ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);

            resolve(canvas.toDataURL());
        };
        img.src = URL.createObjectURL(file);
    });
}

function initializeBoard() {
    gameBoard = Array(boardSize).fill().map(() => Array(boardSize).fill(null));
    const board = document.getElementById('board');
    
    board.style.gridTemplateColumns = `repeat(${boardSize}, 50px)`;
    board.style.gridTemplateRows = `repeat(${boardSize}, 50px)`;
    board.innerHTML = '';

    const mid = Math.floor(boardSize/2);
    gameBoard[mid-1][mid-1] = 'white';
    gameBoard[mid-1][mid] = 'black';
    gameBoard[mid][mid-1] = 'black';
    gameBoard[mid][mid] = 'white';

    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.onclick = () => makeMove(i, j);
            if (gameBoard[i][j]) {
                const disc = document.createElement('div');
                disc.className = `disc ${gameBoard[i][j]}`;
                cell.appendChild(disc);
            }
            board.appendChild(cell);
        }
    }
    
    updateTurnIndicator();
}

function makeMove(row, col) {
    if (gameBoard[row][col] || !isValidMove(row, col)) return;

    gameBoard[row][col] = currentPlayer;
    flipDiscs(row, col);
    updateBoard();
    
    document.getElementById('showImageBtn').style.display = 'block';
}

function showImage() {
    // 既存のoverlayがあれば削除
    let existingOverlay = document.getElementById('imageOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // 新しいoverlay要素を作成
    const overlay = document.createElement('div');
    overlay.id = 'imageOverlay';
    
    const board = document.getElementById('board');

    overlay.style.display = 'block';
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.boxSizing = 'border-box';
    overlay.style.padding = '10px'; // boardと同じパディング
    overlay.style.gap = '4px'; // boardと同じギャップ

    overlay.style.backgroundImage = `url(${uploadedImage})`;
    overlay.style.backgroundSize = '100% 100%';
    
    const maskImage = createMask();
    overlay.style.webkitMaskImage = maskImage;
    overlay.style.maskImage = maskImage;

    board.appendChild(overlay);

    document.getElementById('showImageBtn').style.display = 'none';
    document.getElementById('closeImageBtn').style.display = 'block';
    
    const timerDisplay = document.getElementById('timerDisplay');
    const countdown = document.getElementById('countdown');
    timerDisplay.style.display = 'block';
    countdown.textContent = '30';
    countdown.style.color = '#333';
    
    let timeLeft = 30;
    
    countdownInterval = setInterval(() => {
        timeLeft--;
        countdown.textContent = timeLeft;
        
        if (timeLeft <= 10) {
            countdown.style.color = '#ff0000';
        }
        
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);

    imageTimer = setTimeout(() => {
        closeImage();
    }, 30000);
}

function createMask() {
    const canvas = document.createElement('canvas');
    const cellSize = 50;
    const padding = 10; // boardのパディング値
    const gap = 4; // cellsの間のギャップ
    const totalGapSize = gap * (boardSize - 1); // 全ギャップの合計サイズ
    
    // パディングとギャップを含めた全体のサイズを計算
    canvas.width = (cellSize * boardSize) + (padding * 2) + totalGapSize;
    canvas.height = (cellSize * boardSize) + (padding * 2) + totalGapSize;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (gameBoard[i][j] === currentPlayer) {
                // パディングとギャップを考慮した位置にマスクを描画
                const x = j * (cellSize + gap) + padding;
                const y = i * (cellSize + gap) + padding;
                ctx.fillRect(x, y, cellSize, cellSize);
            }
        }
    }
    
    return `url(${canvas.toDataURL()})`;
}


function closeImage() {
    if (imageTimer) {
        clearTimeout(imageTimer);
        imageTimer = null;
    }
    
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    
    const overlay = document.getElementById('imageOverlay');
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
    
    document.getElementById('closeImageBtn').style.display = 'none';
    document.getElementById('timerDisplay').style.display = 'none';
    currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
    updateTurnIndicator();
}

function isValidMove(row, col) {
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];

    for (let [dx, dy] of directions) {
        if (wouldFlip(row, col, dx, dy)) return true;
    }
    return false;
}

function wouldFlip(row, col, dx, dy) {
    let x = row + dx;
    let y = col + dy;
    let count = 0;

    while (x >= 0 && x < boardSize && y >= 0 && y < boardSize) {
        if (!gameBoard[x][y]) return false;
        if (gameBoard[x][y] === currentPlayer) {
            return count > 0;
        }
        count++;
        x += dx;
        y += dy;
    }
    return false;
}

function flipDiscs(row, col) {
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];

    for (let [dx, dy] of directions) {
        if (wouldFlip(row, col, dx, dy)) {
            let x = row + dx;
            let y = col + dy;
            while (gameBoard[x][y] !== currentPlayer) {
                gameBoard[x][y] = currentPlayer;
                x += dx;
                y += dy;
            }
        }
    }
}

function updateBoard() {
    const cells = document.querySelectorAll('.cell');
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const cell = cells[i * boardSize + j];
            cell.innerHTML = '';
            if (gameBoard[i][j]) {
                const disc = document.createElement('div');
                disc.className = `disc ${gameBoard[i][j]}`;
                cell.appendChild(disc);
            }
        }
    }
}

function updateTurnIndicator() {
    const disc = document.getElementById('currentPlayerDisc');
    disc.className = 'disc ' + currentPlayer;
}

function resetGame() {
    if (imageTimer) {
        clearTimeout(imageTimer);
        imageTimer = null;
    }
    
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('settingsScreen').style.display = 'block';
    document.getElementById('imageUpload').value = '';
    document.getElementById('imageOverlay').style.display = 'none';
    document.getElementById('closeImageBtn').style.display = 'none';
    document.getElementById('timerDisplay').style.display = 'none';
    currentPlayer = 'black';
    updateTurnIndicator();
}

document.getElementById('showImageBtn').onclick = showImage;
document.getElementById('closeImageBtn').onclick = closeImage;