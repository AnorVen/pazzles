import { timerOutput } from "../../presentation/dom.js";

let timerId = null;
let startTime = 0;

export function startTimer() {
  startTime = Date.now();
  timerOutput.textContent = "00:00";
  timerId = window.setInterval(() => {
    timerOutput.textContent = formatTime(Date.now() - startTime);
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

export function formatTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
