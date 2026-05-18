const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

const scorePlayerEl = document.getElementById('scorePlayer');
const scoreBotEl = document.getElementById('scoreBot');
const choiceDisplayEl = document.getElementById('choiceDisplay');
const resultTextEl = document.getElementById('resultText');
const countdownEl = document.getElementById('countdownText');
const roundInfoEl = document.getElementById('roundInfo');
const playerNameDisplay = document.getElementById('playerNameDisplay');

// Các Modal
const nameModal = document.getElementById('nameModal');
const gameOverModal = document.getElementById('gameOverModal');

// Âm thanh
const soundTick = new Audio('tick.mp3'); 
const soundWin = new Audio('win.mp3');
const soundLose = new Audio('lose.mp3');

let diemNguoiChoi = 0;
let diemMay = 0;
let luotChoi = 0;
const MAX_LUOT = 10; 

let tenNguoiChoi = "";
let isGameActive = false; 
let isPlaying = false;    
let currentGesture = "Đang chờ... 🤔"; 

// --- QUẢN LÝ GIAO DIỆN VÀ BẢNG XẾP HẠNG TRỰC TIẾP ---

// Khởi chạy hiển thị BXH ngay khi web load
hienThiBXH();

function batDauGame() {
    const inputName = document.getElementById('playerNameInput').value.trim();
    tenNguoiChoi = inputName === "" ? "Vô Danh" : inputName;
    
    diemNguoiChoi = 0;
    diemMay = 0;
    luotChoi = 0;
    
    scorePlayerEl.innerText = diemNguoiChoi;
    scoreBotEl.innerText = diemMay;
    playerNameDisplay.innerText = tenNguoiChoi;
    capNhatHienThiLuot();

    nameModal.classList.add('hidden');
    isGameActive = true;
    resultTextEl.innerText = "Sẵn sàng! Đưa tay lên để chơi.";
}

function capNhatHienThiLuot() {
    roundInfoEl.innerText = `Người chơi: ${tenNguoiChoi} | Lượt: ${luotChoi} / ${MAX_LUOT}`;
}

function ketThucGame() {
    isGameActive = false;
    luotUuDiem(); 
    hienThiBXH(); // Cập nhật lại BXH bên phải ngay lập tức
    
    document.getElementById('finalScoreText').innerText = `Tổng điểm: ${diemNguoiChoi}`;
    gameOverModal.classList.remove('hidden');
}

function resetChoNguoiMoi() {
    document.getElementById('playerNameInput').value = ""; 
    gameOverModal.classList.add('hidden');
    nameModal.classList.remove('hidden');
}

function luotUuDiem() {
    if(diemNguoiChoi === 0) return;
    let danhSachDiem = JSON.parse(localStorage.getItem('aiOanTuTi_HighScores')) || [];
    danhSachDiem.push({ ten: tenNguoiChoi, diem: diemNguoiChoi });
    danhSachDiem.sort((a, b) => b.diem - a.diem);
    danhSachDiem = danhSachDiem.slice(0, 5); // Lưu TOP 5
    localStorage.setItem('aiOanTuTi_HighScores', JSON.stringify(danhSachDiem));
}

// Hàm này giờ sẽ in điểm ra khung bên phải
function hienThiBXH() {
    const listEl = document.getElementById('highScoreList');
    listEl.innerHTML = ""; 
    
    const danhSachDiem = JSON.parse(localStorage.getItem('aiOanTuTi_HighScores')) || [];
    
    if (danhSachDiem.length === 0) {
        listEl.innerHTML = "<li>Chưa có ai chơi. Hãy mở bát!</li>";
    } else {
        danhSachDiem.forEach((item, index) => {
            listEl.innerHTML += `<li><span>#${index + 1} ${item.ten}</span> <span>${item.diem} 🏆</span></li>`;
        });
    }
}

// --- LOGIC NHẬN DIỆN & GAME ---

function detectGesture(landmarks) {
    const isIndexOpen = landmarks[8].y < landmarks[6].y;
    const isMiddleOpen = landmarks[12].y < landmarks[10].y;
    const isRingOpen = landmarks[16].y < landmarks[14].y;
    const isPinkyOpen = landmarks[20].y < landmarks[18].y;

    if (!isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) return "Búa ✊";
    if (isIndexOpen && isMiddleOpen && !isRingOpen && !isPinkyOpen) return "Kéo ✌️";
    if (isIndexOpen && isMiddleOpen && isRingOpen && isPinkyOpen) return "Bao ✋";
    return "Đang chờ... 🤔";
}

function batDauVongChoi() {
    isPlaying = true;
    let dem = 3; 
    
    countdownEl.classList.remove('hidden');
    choiceDisplayEl.innerText = "Trận đấu bắt đầu...";
    resultTextEl.innerText = "Giữ nguyên tay nhé!";
    resultTextEl.style.color = "#fbd38d";

    const interval = setInterval(() => {
        countdownEl.innerText = dem;
        soundTick.currentTime = 0; soundTick.play().catch(e => {}); 

        if (dem === 0) {
            clearInterval(interval);
            countdownEl.classList.add('hidden');
            xetThangThua();
        }
        dem--;
    }, 1000);
}

function xetThangThua() {
    const luaChonCuaBan = currentGesture;

    if (luaChonCuaBan === "Đang chờ... 🤔") {
        resultTextEl.innerText = "Bạn đã rút tay lại! Thử lại nhé.";
        resultTextEl.style.color = "#a0aec0";
        setTimeout(() => { isPlaying = false; countdownEl.innerText = 3; }, 2000);
        return;
    }

    luotChoi++;
    capNhatHienThiLuot();

    const cacLuaChon = ["Kéo ✌️", "Búa ✊", "Bao ✋"];
    const luaChonCuaMay = cacLuaChon[Math.floor(Math.random() * 3)];

    choiceDisplayEl.innerHTML = `Bạn ra: <b>${luaChonCuaBan}</b> &nbsp;|&nbsp; AI ra: <b>${luaChonCuaMay}</b>`;

    if (luaChonCuaBan === luaChonCuaMay) {
        resultTextEl.innerText = "HÒA NHAU! 🤝";
        resultTextEl.style.color = "#fbd38d";
    } else if (
        (luaChonCuaBan === "Kéo ✌️" && luaChonCuaMay === "Bao ✋") ||
        (luaChonCuaBan === "Búa ✊" && luaChonCuaMay === "Kéo ✌️") ||
        (luaChonCuaBan === "Bao ✋" && luaChonCuaMay === "Búa ✊")
    ) {
        resultTextEl.innerText = "BẠN THẮNG! 🎉";
        resultTextEl.style.color = "#00e5ff";
        diemNguoiChoi++;
        
        // 🌟 HIỆU ỨNG THẮNG: Làm mờ camera cũ và tung pháo hoa
        canvasElement.classList.add('blur-effect'); // Làm mờ
        confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 }, zIndex: 9999 }); // Bắn pháo
        soundWin.currentTime = 0; soundWin.play().catch(e=>{});
        
        // Tắt làm mờ sau 2.5 giây
        setTimeout(() => { canvasElement.classList.remove('blur-effect'); }, 2500);

    } else {
        resultTextEl.innerText = "MÁY THẮNG! 🤖";
        resultTextEl.style.color = "#ff3366";
        diemMay++;
        
        soundLose.currentTime = 0; soundLose.play().catch(e=>{});
    }

    scorePlayerEl.innerText = diemNguoiChoi;
    scoreBotEl.innerText = diemMay;

    if (luotChoi >= MAX_LUOT) {
        setTimeout(ketThucGame, 2000); 
    } else {
        setTimeout(() => { 
            isPlaying = false; 
            countdownEl.innerText = 3;
            resultTextEl.innerText = "Đưa tay lên để chơi ván mới!";
        }, 3000);
    }
}

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.translate(canvasElement.width, 0);
    canvasCtx.scale(-1, 1);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00e5ff', lineWidth: 4});
            drawLandmarks(canvasCtx, landmarks, {color: '#b026ff', lineWidth: 2});
                          
            currentGesture = detectGesture(landmarks);
            
            if (isGameActive && currentGesture !== "Đang chờ... 🤔" && !isPlaying && luotChoi < MAX_LUOT) {
                batDauVongChoi();
            }
        }
    } else {
        currentGesture = "Đang chờ... 🤔";
    }
    canvasCtx.restore();
}

const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
hands.onResults(onResults);

const camera = new Camera(videoElement, { onFrame: async () => { await hands.send({image: videoElement}); }, width: 640, height: 480 });
camera.start();