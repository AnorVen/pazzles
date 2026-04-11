export const gameModes = {
  easy: {
    id: "easy",
    label: "Лёгкий",
    description:
      "Свободный вход в партию: подсказки не штрафуют, а счёт считается мягко.",
    scoreHint:
      "Подсказки бесплатны, штрафы за помощь снижены, итоговый счёт спокойнее.",
    scoreBase: 85,
    timePenalty: 0.6,
    hintPenalty: 0,
    orderPenalty: 35,
    shufflePenalty: 30,
    bonus: 6,
    hintsAllowed: true,
    timeLimitMs: null,
    message:
      "Мягкая партия завершена. Отличный режим, чтобы разогреться и поймать ритм.",
  },
  calm: {
    id: "calm",
    label: "Спокойный",
    description: "Собирайте в удобном темпе и держите красивый ритм партии.",
    scoreHint: "Подсказки и помощь почти не мешают итоговому счёту.",
    scoreBase: 110,
    timePenalty: 1.2,
    hintPenalty: 50,
    orderPenalty: 80,
    shufflePenalty: 70,
    bonus: 12,
    hintsAllowed: true,
    timeLimitMs: null,
    message:
      "Тихая, аккуратная партия. Результат уже отправлен в таблицу лидеров.",
  },
  classic: {
    id: "classic",
    label: "Классический",
    description:
      "Сбалансированный режим: помощь доступна, но время и действия уже заметно влияют на итог.",
    scoreHint:
      "За скорость дают больше, а подсказка и перемешивание ощутимо снижают счёт.",
    scoreBase: 130,
    timePenalty: 1.9,
    hintPenalty: 95,
    orderPenalty: 130,
    shufflePenalty: 110,
    bonus: 20,
    hintsAllowed: true,
    timeLimitMs: null,
    message:
      "Партия собрана в классическом режиме. Баланс точности и темпа получился убедительным.",
  },
  challenge: {
    id: "challenge",
    label: "Испытание",
    description:
      "Жёсткий темп: подсказки отключены, а на сборку даётся ограниченное время.",
    scoreHint:
      "Подсказки запрещены. Успейте собрать пазл за 05:00, чтобы зафиксировать результат.",
    scoreBase: 150,
    timePenalty: 2.8,
    hintPenalty: 180,
    orderPenalty: 260,
    shufflePenalty: 140,
    bonus: 30,
    hintsAllowed: false,
    timeLimitMs: 5 * 60 * 1000,
    message:
      "Сильная партия. Чем меньше помощи, тем выше будет следующий рекорд.",
  },
};

export function getGameMode(modeId) {
  return gameModes[modeId] || gameModes.calm;
}

export function getSelectedModeId(modeInputs) {
  const selected = Array.from(modeInputs).find((input) => input.checked);

  return selected ? selected.value : "calm";
}

export function setSelectedMode(modeInputs, modeId) {
  Array.from(modeInputs).forEach((input) => {
    input.checked = input.value === modeId;
  });
}
