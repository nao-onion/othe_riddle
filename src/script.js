// script.js
let boardSize;
let gameBoard;
let currentPlayer = 'black';
let uploadedImage = null;
let imageTimer = null;

function startGame() {
    if (!document.getElementById('imageUpload').files[0]) {
        alert('画像をアップロードしてください');
        return;
    }

    boardSize = parseInt(document.getElementById('boardSize').value);
    
    // 画像の処理を非同期で行う
    const file = document.getElementById('imageUpload').files[0];
    processImage(file).then(processedImageUrl => {
        uploadedImage = processedImageUrl;
        document.getElementById('settingsScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'block';
        initializeBoard();
    });
}

// 画像の処理（リサイズと中央配置）
function processImage(file) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const boardPixelSize = boardSize * 50; // 盤面のピクセルサイズ
            canvas.width = boardPixelSize;
            canvas.height = boardPixelSize;
            const ctx = canvas.getContext('2d');

            // 画像のアスペクト比を維持しながらリサイズ
            let newWidth, newHeight;
            const aspectRatio = img.width / img.height;

            if (aspectRatio > 1) {
                // 横長の画像
                newWidth = boardPixelSize;
                newHeight = boardPixelSize / aspectRatio;
            } else {
                // 縦長の画像
                newHeight = boardPixelSize;
                newWidth = boardPixelSize * aspectRatio;
            }

            // 中央に配置するためのオフセットを計算
            const offsetX = (boardPixelSize - newWidth) / 2;
            const offsetY = (boardPixelSize - newHeight) / 2;

            // 背景を白で塗りつぶし
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, boardPixelSize, boardPixelSize);

            // 画像を中央に描画
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
    board.innerHTML = '';

    // 初期配置
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
}

function makeMove(row, col) {
    if (gameBoard[row][col] || !isValidMove(row, col)) return;

    gameBoard[row][col] = currentPlayer;
    flipDiscs(row, col);
    updateBoard();
    
    document.getElementById('showImageBtn').style.display = 'block';
}

function showImage() {
    const overlay = document.getElementById('imageOverlay');
    overlay.style.display = 'block';
    overlay.style.backgroundImage = `url(${uploadedImage})`;
    
    // マスクの作成
    overlay.style.webkitMaskImage = createMask();
    overlay.style.maskImage = createMask();

    // 画像の表示スタイルを調整
    overlay.style.backgroundSize = 'contain';
    overlay.style.backgroundPosition = 'center';
    overlay.style.backgroundRepeat = 'no-repeat';

    document.getElementById('showImageBtn').style.display = 'none';
    
    imageTimer = setTimeout(() => {
        overlay.style.display = 'none';
        currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
    }, 30000);
}


function createMask() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = boardSize * 50;
    canvas.height = boardSize * 50;
    
    ctx.fillStyle = 'black';
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (gameBoard[i][j] === currentPlayer) {
                ctx.fillRect(j * 50, i * 50, 50, 50);
            }
        }
    }
    
    return `url(${canvas.toDataURL()})`;
}

function isValidMove(row, col) {
    // オセロのルールに基づく有効な手かどうかをチェック
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

function resetGame() {
    if (imageTimer) clearTimeout(imageTimer);
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('settingsScreen').style.display = 'block';
    document.getElementById('imageUpload').value = '';
    document.getElementById('imageOverlay').style.display = 'none';
    currentPlayer = 'black';
}

document.getElementById('showImageBtn').onclick = showImage;