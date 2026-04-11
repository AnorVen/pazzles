const appCopy = {
  menu: {
    eyebrow: "HTML Puzzle",
    title: "Тихая мастерская для красивых и сложных пазлов",
    heroText:
      "Сначала загрузите группу картинок, затем запускайте партии по одной. После каждой победы приложение подготовит следующий кадр автоматически.",
    previewLabel: "Работа с пулом",
    previewTitle: "Один набор изображений, несколько партий подряд",
    features: [
      "Загрузка сразу нескольких изображений",
      "Случайный выбор картинки перед стартом",
      "Автоматическая подготовка следующей партии после победы",
    ],
    hint: "Сначала загрузите группу картинок, затем запускайте первую партию.",
  },
  howToPlay: {
    title: "Как играть",
    intro:
      "Правила простые: игра всегда берёт картинку из общего пула, а после победы заранее подготавливает следующую партию.",
    quickStart:
      "Загрузите группу картинок на стартовом экране, настройте размеры и цвета, затем нажмите «Начать» и собирайте случайно выбранное изображение.",
    steps: [
      {
        title: "1. Сформируйте пул изображений",
        description:
          "На первом экране нажмите кнопку загрузки группы картинок. Приложение добавит их в общий пул для следующих партий.",
      },
      {
        title: "2. Настройте правила партии",
        description:
          "На странице настроек выберите размеры пазла, режим и оформление поля. Эти параметры будут применяться ко всем новым партиям.",
      },
      {
        title: "3. Запустите игру",
        description:
          "Кнопка «Начать» выбирает одну картинку из пула и запускает пазл. Во время игры можно смотреть прогресс, время и счёт.",
      },
      {
        title: "4. Завершите партию и получите следующую",
        description:
          "После победы результат попадёт в таблицу лидеров, а приложение сразу подготовит новую картинку из пула для следующего запуска.",
      },
    ],
  },
};

export function applyStaticCopy() {
  applyText("#menuPage .eyebrow", appCopy.menu.eyebrow);
  applyText("#menuPage h1", appCopy.menu.title);
  applyText("#menuPage .heroText", appCopy.menu.heroText);
  applyText(".previewLabel", appCopy.menu.previewLabel);
  applyText(".menuPreviewCard strong", appCopy.menu.previewTitle);
  applyList("#menuPage .menuFeatureList", appCopy.menu.features);
  applyText("#menuHint", appCopy.menu.hint);

  applyText("#howToPlayTitle", appCopy.howToPlay.title);
  applyText("#howToPlayIntro", appCopy.howToPlay.intro);
  applyText("#howToPlayQuickStart", appCopy.howToPlay.quickStart);
  renderSteps("#howToPlaySteps", appCopy.howToPlay.steps);
}

function applyText(selector, value) {
  const element = document.querySelector(selector);

  if (!element) {
    return;
  }

  element.textContent = value;
}

function applyList(selector, items) {
  const element = document.querySelector(selector);

  if (!element) {
    return;
  }

  element.innerHTML = "";

  items.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    element.append(listItem);
  });
}

function renderSteps(selector, steps) {
  const element = document.querySelector(selector);

  if (!element) {
    return;
  }

  element.innerHTML = "";

  steps.forEach((step) => {
    const article = document.createElement("article");
    const title = document.createElement("h3");
    const description = document.createElement("p");

    article.className = "infoCard infoCard--step";
    title.textContent = step.title;
    description.className = "heroText";
    description.textContent = step.description;
    article.append(title, description);
    element.append(article);
  });
}
