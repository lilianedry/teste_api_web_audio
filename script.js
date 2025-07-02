const audioEl = document.getElementById("audio");
const playPauseBtn = document.getElementById("playPause");
const playPauseIcon = document.getElementById("playPauseIcon");
const muteBtn = document.getElementById("mute");
const volumeIcon = document.getElementById("volumeIcon");
const volumeSlider = document.getElementById("volume");
const progressWrap = document.getElementById("progressWrap");
const progressFilled = document.getElementById("progressFilled");
const currentTimeEl = document.getElementById("currentTime");
const totalTimeEl = document.getElementById("totalTime");
const volumeContainer = document.querySelector(".volume-container");

// Web Audio API
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();
const trackNode = audioCtx.createMediaElementSource(audioEl);
const gainNode = audioCtx.createGain();
trackNode.connect(gainNode).connect(audioCtx.destination);

function ensureContext() {
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60) || 0;
  const secs = Math.floor(seconds % 60) || 0;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

audioEl.addEventListener("loadedmetadata", () => {
  totalTimeEl.textContent = formatTime(audioEl.duration);
});

playPauseBtn.addEventListener("click", () => {
  ensureContext();
  if (audioEl.paused) {
    audioEl.play();
    playPauseIcon.classList.replace("fa-play", "fa-pause");
  } else {
    audioEl.pause();
    playPauseIcon.classList.replace("fa-pause", "fa-play");
  }
});

// Volume
let lastVolume = volumeSlider.value;

muteBtn.addEventListener("click", () => {
  if (audioEl.muted || gainNode.gain.value === 0) {
    gainNode.gain.value = lastVolume || 1;
    audioEl.muted = false;
    volumeSlider.value = lastVolume;
  } else {
    lastVolume = gainNode.gain.value;
    gainNode.gain.value = 0;
    audioEl.muted = true;
    volumeSlider.value = 0;
  }

  volumeIcon.classList.toggle("fa-volume-high", !audioEl.muted);
  volumeIcon.classList.toggle("fa-volume-xmark", audioEl.muted);
});

volumeSlider.addEventListener("input", (e) => {
  const v = parseFloat(e.target.value);
  gainNode.gain.value = v;
  audioEl.muted = v === 0;
  volumeIcon.classList.toggle("fa-volume-high", v > 0);
  volumeIcon.classList.toggle("fa-volume-xmark", v === 0);
  if (v > 0) lastVolume = v;
});

// Progress bar
audioEl.addEventListener("timeupdate", () => {
  if (audioEl.duration) {
    const percent = (audioEl.currentTime / audioEl.duration) * 100;
    progressFilled.style.width = `${percent}%`;
    currentTimeEl.textContent = formatTime(audioEl.currentTime);
  }
});

progressWrap.addEventListener("click", (e) => {
  const rect = progressWrap.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  audioEl.currentTime = percent * audioEl.duration;
});

document.getElementById("prev").addEventListener("click", () => (audioEl.currentTime = 0));
document.getElementById("next").addEventListener("click", () => (audioEl.currentTime = Math.max(0, audioEl.duration - 1)));

// Hover logic para slider de volume
let hideTimeout = null;

volumeContainer.addEventListener("mouseenter", () => {
  clearTimeout(hideTimeout);
  volumeContainer.classList.add("hovering");
});

volumeContainer.addEventListener("mouseleave", () => {
  hideTimeout = setTimeout(() => {
    volumeContainer.classList.remove("hovering");
  }, 500); // meio segundo
});
