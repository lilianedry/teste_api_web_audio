let audioContext;
let sourceNode;
let gainNode;
let filterNode;
let audioBuffer;

let isPlaying = false;
let isFilterOn = false;
let startTime = 0;
let pausedAt = 0;

// Elementos da interface
const volumeControl = document.getElementById("volumeControl");
const playPauseBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stopBtn");
const toggleFilterBtn = document.getElementById("toggleFilter");
const progressBar = document.getElementById("progressBar");
const currentTimeDisplay = document.getElementById("currentTime");
const durationDisplay = document.getElementById("duration");

// Formata o tempo como mm:ss
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

async function setupAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioContext.createGain();
    filterNode = audioContext.createBiquadFilter();
    filterNode.type = "lowpass";
    filterNode.frequency.value = 1000;
    gainNode.connect(audioContext.destination);
  }

  if (!audioBuffer) {
    const response = await fetch("pregacao.mp3");
    const arrayBuffer = await response.arrayBuffer();
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    durationDisplay.textContent = formatTime(audioBuffer.duration);
  }
}

function stopAudio() {
  if (sourceNode) {
    try {
      sourceNode.stop();
    } catch (e) {}
    sourceNode.disconnect();
    sourceNode = null;
  }
  isPlaying = false;
  pausedAt = 0;
  startTime = 0;
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  progressBar.value = 0;
  currentTimeDisplay.textContent = "00:00";
}

function createSource(offset = 0) {
  // Para evitar sobreposição
  stopAudio();

  const newSource = audioContext.createBufferSource();
  newSource.buffer = audioBuffer;

  if (isFilterOn) {
  newSource.connect(distortionNode).connect(gainNode);
  } else {
    newSource.connect(gainNode);
  }


  newSource.start(0, offset);
  startTime = audioContext.currentTime - offset;
  isPlaying = true;

  newSource.onended = () => {
    if (isPlaying) {
      stopAudio();
    }
  };

  sourceNode = newSource;
}

function playPause() {
  if (!audioBuffer) return;

  if (isPlaying) {
    sourceNode.stop();
    pausedAt = audioContext.currentTime - startTime;
    isPlaying = false;
    sourceNode = null;
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  } else {
    createSource(pausedAt);
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
  }
}

function updateProgressBar() {
  if (isPlaying && audioBuffer) {
    const currentTime = audioContext.currentTime - startTime;
    const progress = (currentTime / audioBuffer.duration) * 100;
    progressBar.value = progress;
    currentTimeDisplay.textContent = formatTime(currentTime);
  }
}

//Função para criar a curva de distorção
function makeDistortionCurve(amount) {
  let n_samples = 44100;
  let curve = new Float32Array(n_samples);
  let deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    let x = i * 2 / n_samples - 1;
    curve[i] = (3 + amount) * x * 20 * deg / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}


progressBar.addEventListener("input", () => {
  if (!audioBuffer) return;
  const newTime = (progressBar.value / 100) * audioBuffer.duration;
  pausedAt = newTime;

  if (isPlaying) {
    createSource(newTime);
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
  } else {
    currentTimeDisplay.textContent = formatTime(newTime);
  }
});

playPauseBtn.addEventListener("click", async () => {
  await setupAudio();
  playPause();
  distortionNode = audioContext.createWaveShaper();
  distortionNode.curve = makeDistortionCurve(400);
  distortionNode.oversample = '4x';

});

stopBtn.addEventListener("click", () => {
  stopAudio();
});

volumeControl.addEventListener("input", () => {
  if (gainNode) gainNode.gain.value = volumeControl.value;
});

toggleFilterBtn.addEventListener("click", () => {
  isFilterOn = !isFilterOn;
  if (isPlaying) {
    const currentTime = audioContext.currentTime - startTime;
    if (sourceNode) sourceNode.stop();
    createSource(currentTime);
  }
});

setInterval(updateProgressBar, 200);
