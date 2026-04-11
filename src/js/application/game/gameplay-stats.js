import {
  gameGoalText,
  gameModeBadge,
  groupsValue,
  piecesSummary,
  placedPiecesValue,
  progressFill,
  progressPercentOutput,
  scoreHint,
  scoreValue,
  winMessage,
  winMode,
  winPieces,
  winScore,
} from "../../presentation/dom.js";
import { getGameMode } from "../../domain/game/game-modes.js";

const defaultSession = {
  cols: 0,
  rows: 0,
  totalPieces: 0,
  fileName: "",
  mode: "calm",
  hintUses: 0,
  orderUses: 0,
  shuffleUses: 0,
};

let session = { ...defaultSession };

export function initializeGameplaySession({ cols, rows, fileName, mode }) {
  session = {
    cols,
    rows,
    totalPieces: cols * rows,
    fileName,
    mode,
    hintUses: 0,
    orderUses: 0,
    shuffleUses: 0,
  };

  renderModeInfo();
  renderHud({
    progressPercent: 0,
    placedPieces: 0,
    groups: 0,
    score: calculateScore(0),
  });
}

export function recordGameplayAction(actionName) {
  if (actionName === "hint") {
    session.hintUses += 1;
  }

  if (actionName === "order") {
    session.orderUses += 1;
  }

  if (actionName === "shuffle") {
    session.shuffleUses += 1;
  }
}

export function updateGameplayHud(puzzleCanvas, elapsedMs) {
  const metrics = collectPuzzleMetrics(puzzleCanvas, session);

  renderHud({
    progressPercent: metrics.progressPercent,
    placedPieces: metrics.placedPieces,
    groups: metrics.groups,
    score: calculateScore(elapsedMs),
  });

  return metrics;
}

export function buildWinPayload({ elapsedMs, elapsedLabel, fileName }) {
  const mode = getGameMode(session.mode);
  const score = calculateScore(elapsedMs);

  winScore.textContent = formatScore(score);
  winMode.textContent = mode.label;
  winPieces.textContent = `${session.cols} × ${session.rows} (${session.totalPieces})`;
  winMessage.textContent = mode.message;

  return {
    playedAt: Date.now(),
    cols: session.cols,
    rows: session.rows,
    totalPieces: session.totalPieces,
    elapsedMs,
    elapsedLabel,
    fileName: fileName || session.fileName,
    mode: session.mode,
    score,
  };
}

export function completeGameplayHud(elapsedMs) {
  renderHud({
    progressPercent: 100,
    placedPieces: session.totalPieces,
    groups: session.totalPieces > 0 ? 1 : 0,
    score: calculateScore(elapsedMs),
  });
}

function renderModeInfo() {
  const mode = getGameMode(session.mode);

  gameModeBadge.textContent = mode.label;
  gameGoalText.textContent = mode.description;
  scoreHint.textContent = mode.scoreHint;
  piecesSummary.textContent = `${session.cols} × ${session.rows}`;
}

function renderHud({ progressPercent, placedPieces, groups, score }) {
  progressPercentOutput.textContent = `${progressPercent}%`;
  progressFill.style.width = `${progressPercent}%`;
  placedPiecesValue.textContent = `${placedPieces} / ${session.totalPieces}`;
  groupsValue.textContent = String(groups);
  scoreValue.textContent = formatScore(score);
}

function calculateScore(elapsedMs) {
  const mode = getGameMode(session.mode);
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const penalties =
    totalSeconds * mode.timePenalty +
    session.hintUses * mode.hintPenalty +
    session.orderUses * mode.orderPenalty +
    session.shuffleUses * mode.shufflePenalty;
  const baseScore =
    session.totalPieces * mode.scoreBase + session.totalPieces * mode.bonus;

  return Math.max(session.totalPieces * 25, Math.round(baseScore - penalties));
}

function collectPuzzleMetrics(puzzleCanvas, currentSession) {
  if (!puzzleCanvas || !puzzleCanvas.puzzle?.pieces?.length) {
    return {
      progressPercent: 0,
      placedPieces: 0,
      groups: 0,
    };
  }

  const { pieces } = puzzleCanvas.puzzle;
  const totalConnections =
    currentSession.rows * Math.max(0, currentSession.cols - 1) +
    currentSession.cols * Math.max(0, currentSession.rows - 1);
  const connectedEdges = Math.round(
    pieces.reduce((sum, piece) => sum + piece.presentConnections.length, 0) / 2,
  );
  const connectionPercent =
    totalConnections > 0
      ? Math.round((connectedEdges / totalConnections) * 100)
      : 100;
  const tolerance = 6;
  const placedPieces = pieces.filter((piece) => {
    const currentPosition = piece.centralAnchor.asVector();
    const targetPosition = piece.metadata.targetPosition;

    return (
      Math.abs(currentPosition.x - targetPosition.x) <= tolerance &&
      Math.abs(currentPosition.y - targetPosition.y) <= tolerance
    );
  }).length;
  const placementPercent = Math.round(
    (placedPieces / currentSession.totalPieces) * 100,
  );

  return {
    progressPercent: Math.max(connectionPercent, placementPercent),
    placedPieces,
    groups: countGroups(pieces),
  };
}

function countGroups(pieces) {
  const seen = new Set();
  let groups = 0;

  pieces.forEach((piece) => {
    if (seen.has(piece.id)) {
      return;
    }

    groups += 1;
    const stack = [piece];

    while (stack.length) {
      const currentPiece = stack.pop();

      if (!currentPiece || seen.has(currentPiece.id)) {
        continue;
      }

      seen.add(currentPiece.id);
      currentPiece.presentConnections.forEach((neighbor) => {
        if (!seen.has(neighbor.id)) {
          stack.push(neighbor);
        }
      });
    }
  });

  return groups;
}

function formatScore(score) {
  return new Intl.NumberFormat("ru-RU").format(score);
}
