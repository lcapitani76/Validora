
const symbols = ['btc', 'bnb', 'doge', 'eth', 'ltc', 'xmr'];
const wild = 'wild';

let freeSpins = 0;
let spinning = false;

let balance = 1000;

function updateBalanceDisplay() {
  if (freeSpins == 0) 
  {
  	  document.getElementById("spin-button").disabled = false;
	  document.getElementById("spin-button").style.opacity = "1";
	  document.getElementById("bet-amount").disabled = false;
	  document.getElementById("bet-amount").style.opacity = "1";
  }  
  const display = document.getElementById('balance-display');
  if (display) display.innerText = `💰 Balance: ${balance} VLD`;
}


function imageFor(symbol) {
  return `<img src="symbols/${symbol}.png" alt="${symbol}" title="${symbol.toUpperCase()}">`;
}

function spinMatrix() {
  const matrix = [];
  for (let col = 0; col < 3; col++) {
    const colArr = [];
    for (let row = 0; row < 3; row++) {
      const pick = Math.random() < 0.15 ? wild : symbols[Math.floor(Math.random() * symbols.length)];
      colArr.push(pick);
    }
    matrix.push(colArr);
  }
  return matrix;
}

const paylines = [
  [0, 0, 0],
  [1, 1, 1],
  [2, 2, 2]
];


const payoutTable = {
  'doge': 2,
  'ltc': 3,
  'xmr': 4,
  'bnb': 5,
  'eth': 7,
  'btc': 10,
  'wild': 0
};

function calculateTotalMultiplier(matrix) {
  let total = 0;
  paylines.forEach((line) => {
    const values = line.map((row, col) => matrix[col][row]);
    const counts = {};
    let wildCount = 0;

    for (const symbol of values) {
      if (symbol === wild) {
        wildCount++;
      } else {
        counts[symbol] = (counts[symbol] || 0) + 1;
      }
    }

    const uniqueSymbols = Object.keys(counts);
    if (uniqueSymbols.length === 1 && (counts[uniqueSymbols[0]] + wildCount === 3)) {
      const symbol = uniqueSymbols[0];
      const multiplier = payoutTable[symbol] || 0;
      total += multiplier;
    }
  });
  return total;
}


function renderMatrix(matrix) {
  const slots = document.querySelector('.slot');
  slots.innerHTML = '';
  for (let row = 0; row < 3; row++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'row';
    for (let col = 0; col < 3; col++) {
      const cell = document.createElement('div');
      cell.className = 'reel';
      const symbol = matrix[col][row];
      cell.innerHTML = imageFor(symbol);
      rowDiv.appendChild(cell);
    }
    slots.appendChild(rowDiv);
  }
}

function checkLine(matrix, line) {
  const values = line.map((row, col) => matrix[col][row]);
  const counts = {};
  let wildCount = 0;

  for (const symbol of values) {
    if (symbol === wild) {
      wildCount++;
    } else {
      counts[symbol] = (counts[symbol] || 0) + 1;
    }
  }

  const uniqueSymbols = Object.keys(counts);

  if (uniqueSymbols.length === 1 && wildCount === 0 && counts[uniqueSymbols[0]] === 3) return true;
  if (uniqueSymbols.length === 1 && wildCount === 1 && counts[uniqueSymbols[0]] === 2) return true;
  if (uniqueSymbols.length === 1 && wildCount === 2 && counts[uniqueSymbols[0]] === 1) return true;

  return false;
}

function triggerEpicBonus(bonusAmount) {
  const boom = document.getElementById('validora-boom');
  const text = document.getElementById('bonus-text');
  const container = document.getElementById('main-container');

  text.textContent = `🎁 +${bonusAmount} FREE SPINS! 🎁`;
  boom.classList.add('show');
  text.classList.add('show');
  container.classList.add('shake');

  setTimeout(() => {
    boom.classList.remove('show');
    text.classList.remove('show');
    container.classList.remove('shake');
  }, 1500);
}


function spin() {
  if (spinning) return;
  spinning = true;
  document.getElementById('result').innerText = '';
  let matrix;
  let count = 0;

  const betAmount = parseInt(document.getElementById('bet-amount')?.value) || 1;
  
  if (balance < betAmount) {
  	document.getElementById('result').innerText = `❌ Not enough Validora to place this bet.`;
	spinning = false;
        return;
     }

  document.getElementById("spin-button").disabled = true;
  document.getElementById("spin-button").style.opacity = "0.5";
  document.getElementById("bet-amount").disabled = true;
  document.getElementById("bet-amount").style.opacity = "0.5";

  const interval = setInterval(() => {
    matrix = spinMatrix();
    renderMatrix(matrix);
    count++;

    if (count >= 20) {
      clearInterval(interval);
      renderMatrix(matrix);

      let winLines = [];
      let triggerBonus = false;

      paylines.forEach((line) => {
        const values = line.map((row, col) => matrix[col][row]);
        if (checkLine(matrix, line)) winLines.push(line);
        if (values.every(v => v === wild)) triggerBonus = true;
      });
      const totalMultiplier = calculateTotalMultiplier(matrix);
      const winAmount = totalMultiplier * betAmount;
      balance += winAmount - betAmount;
      updateBalanceDisplay();

      if (winLines.length > 0) {
        document.getElementById('result').innerText =
           `🚀 You hit ${winLines.length} winning line${winLines.length > 1 ? 's' : ''} and won ${winAmount} VLD!`;

        winLines.forEach(line => {
          line.forEach((row, col) => {
            const cell = document.querySelector(`.slot .row:nth-child(${row + 1}) .reel:nth-child(${col + 1})`);
            if (cell) cell.classList.add('winning');
          });
        });
      } else {
        document.getElementById('result').innerText = `📉 Market's down... try again!`;
      }

      if (triggerBonus) {
        const bonus = Math.floor(Math.random() * 9) + 4;
        freeSpins += bonus;
        triggerEpicBonus(bonus);
        document.getElementById('result').innerText += ` 🪙 BONUS mode: On-chain madness begins!`;
      }

      updateFreeSpinDisplay();
      spinning = false;

      if (freeSpins > 0) {
        setTimeout(() => {
          freeSpins--;
          updateFreeSpinDisplay();
          spin();
        }, 1800);
      }
    }
  }, 100);
  }
function initializeReels() {
  matrix = spinMatrix();
  renderMatrix(matrix);
}

window.onload = () => {
  initializeReels();
};


function updateFreeSpinDisplay() {
  const disp = document.getElementById('freespin');
  disp.innerText = freeSpins > 0 ? `🔁 Free Spin Balance: ${freeSpins}` : '';
}

function openInfoModal() {
  document.getElementById('info-modal').style.display = 'block';
}

function closeInfoModal() {
  document.getElementById('info-modal').style.display = 'none';
}
