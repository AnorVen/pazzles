import { leadersBody, leadersSortSelect, leadersStatusOutput } from "./dom.js";
import { clearScores, exportScores, getScores } from "./score-db.js";

export async function renderLeaders() {
  leadersStatusOutput.textContent = "Загружаю результаты...";

  try {
    const scores = await getScores(50, leadersSortSelect.value);

    if (!scores.length) {
      leadersBody.innerHTML =
        '<tr><td colspan="4">Результатов пока нет.</td></tr>';
      leadersStatusOutput.textContent = "Список лидеров пуст.";
      return;
    }

    leadersBody.innerHTML = scores
      .map(
        (score) => `
          <tr>
            <td>${formatPlayedAt(score.playedAt)}</td>
            <td>${score.cols} × ${score.rows} (${score.totalPieces})</td>
            <td>${score.elapsedLabel}</td>
            <td title="${escapeHtml(score.fileName)}">${escapeHtml(score.fileName)}</td>
          </tr>
        `,
      )
      .join("");
    leadersStatusOutput.textContent = `Показано результатов: ${scores.length}.`;
  } catch {
    leadersBody.innerHTML =
      '<tr><td colspan="4">Не удалось загрузить результаты.</td></tr>';
    leadersStatusOutput.textContent = "Не удалось загрузить результаты.";
  }
}

export async function clearLeaders() {
  leadersStatusOutput.textContent = "Очищаю таблицу лидеров...";

  try {
    await clearScores();
    leadersBody.innerHTML =
      '<tr><td colspan="4">Результатов пока нет.</td></tr>';
    leadersStatusOutput.textContent = "Таблица лидеров очищена.";
  } catch {
    leadersStatusOutput.textContent = "Не удалось очистить базу результатов.";
  }
}

export async function exportLeaders() {
  leadersStatusOutput.textContent = "Готовлю CSV-файл...";

  try {
    const result = await exportScores(leadersSortSelect.value);

    if (result.canceled) {
      leadersStatusOutput.textContent = "Экспорт отменен.";
      return;
    }

    leadersStatusOutput.textContent = `Экспортировано результатов: ${result.count}. Файл: ${result.path}`;
  } catch {
    leadersStatusOutput.textContent = "Не удалось экспортировать результаты.";
  }
}

function formatPlayedAt(timestamp) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
