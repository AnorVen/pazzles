import { leadersStatusOutput, statusOutput } from "../../presentation/dom.js";
import { renderLeaders } from "../../presentation/leaders.js";
import { saveScore } from "../../infrastructure/persistence/score-db.js";

export async function saveWinResult(result) {
  try {
    await saveScore(result);
    await renderLeaders();
    statusOutput.textContent =
      "Пазл собран. Результат сохранен в таблицу лидеров.";
    leadersStatusOutput.textContent = "Результаты обновлены.";
  } catch {
    statusOutput.textContent =
      "Пазл собран, но сохранить результат в локальную базу не удалось.";
  }
}

export async function refreshLeadersPage() {
  await renderLeaders();
}
