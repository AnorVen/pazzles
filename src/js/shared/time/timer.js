import { timerOutput } from "../../presentation/dom.js";

let timerId = null;
let startTime = 0;
let activeTimeLimitMs = null;

export function startTimer({ timeLimitMs = null } = {}) {
  startTime = Date.now();
  activeTimeLimitMs = timeLimitMs;
  renderTimer();
  timerId = window.setInterval(() => {
    renderTimer();
  }, 500);
}

export function stopTimer() {
  if (timerId) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

export function getElapsedTime() {
  return Date.now() - startTime;
}

export function getRemainingTime() {
  if (activeTimeLimitMs === null) {
    return null;
  }

  return Math.max(0, activeTimeLimitMs - getElapsedTime());
}

export function getActiveTimeLimit() {
  return activeTimeLimitMs;
}

export function formatTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function renderTimer() {
  const value =
    activeTimeLimitMs === null ? getElapsedTime() : (getRemainingTime() ?? 0);

  timerOutput.textContent = formatTime(value);
}
