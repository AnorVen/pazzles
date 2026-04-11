export const gameModes = {
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
    message:
      "Тихая, аккуратная партия. Результат уже отправлен в таблицу лидеров.",
  },
  challenge: {
    id: "challenge",
    label: "Испытание",
    description:
      "Высокий счёт любит скорость, уверенную сборку и меньше помощи.",
    scoreHint: "Подсказка, перемешивание и упорядочивание заметно режут счёт.",
    scoreBase: 150,
    timePenalty: 2.8,
    hintPenalty: 180,
    orderPenalty: 260,
    shufflePenalty: 140,
    bonus: 30,
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
