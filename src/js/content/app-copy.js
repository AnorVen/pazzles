const appCopy = {
  menu: {
    eyebrow: "HTML Puzzle",
    title: "Тихая мастерская для красивых и сложных пазлов",
    heroText:
      "Загружайте свои снимки, выбирайте темп игры и собирайте пазл в спокойном режиме или в соревновательном испытании.",
    previewLabel: "Ритм игры",
    previewTitle: "Спокойно, красиво, с памятью о лучших партиях",
    features: [
      "Свой снимок и гибкая сетка деталей",
      "Подсказка, прогресс и текущий счёт",
      "Локальная таблица лидеров и экспорт CSV",
    ],
    hint: "Выберите картинку и настройте размер пазла перед стартом.",
  },
  howToPlay: {
    title: "Как играть",
    intro:
      "Эта страница помогает быстро войти в ритм и не потеряться между настройкой, сборкой и финальным результатом.",
    quickStart:
      "Откройте настройки, выберите изображение, задайте сетку, а затем начните партию и собирайте пазл от простых фрагментов к сложным.",
    steps: [
      {
        title: "1. Подготовьте изображение",
        description:
          "Откройте настройки, загрузите свой файл и выберите количество деталей по горизонтали и вертикали.",
      },
      {
        title: "2. Выберите темп партии",
        description:
          "Спокойный режим подойдёт для размеренной сборки, а испытание сильнее награждает за сложность и скорость.",
      },
      {
        title: "3. Собирайте с опорой на прогресс",
        description:
          "Во время игры следите за процентом сборки, количеством групп и текущим счётом в левой панели.",
      },
      {
        title: "4. Пользуйтесь инструментами вовремя",
        description:
          "Подсказка помогает увидеть исходную картинку, а кнопки упорядочивания и перемешивания пригодятся, если хотите сменить тактику.",
      },
    ],
  },
  about: {
    title: "Зачем нужен этот пазл",
    lead: "HTML Puzzle задуман как камерное приложение, где можно собирать свои изображения без спешки, но с ощущением аккуратного игрового процесса.",
    idea: "Проект совмещает уютную подачу, визуально спокойный интерфейс и понятную структуру экранов: меню, настройки, игра и локальная таблица лидеров.",
    audience:
      "Он подойдёт тем, кто любит настраивать сложность под себя, сохранять лучшие результаты и возвращаться к коротким или длинным партиям.",
    highlights: [
      "Загрузка собственных изображений для каждой партии",
      "Два игровых режима с разным балансом подсказок и очков",
      "Локальное хранение результатов и экспорт таблицы лидеров",
      "Отдельные экраны с понятной навигацией без перегруженного интерфейса",
    ],
    promise:
      "Это предложение простое: дать игроку красивое, сосредоточенное пространство для сборки пазлов, где каждая партия ощущается личной и запоминающейся.",
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

  applyText("#aboutTitle", appCopy.about.title);
  applyText("#aboutLead", appCopy.about.lead);
  applyText("#aboutIdea", appCopy.about.idea);
  applyText("#aboutAudience", appCopy.about.audience);
  applyList("#aboutHighlights", appCopy.about.highlights);
  applyText("#aboutPromise", appCopy.about.promise);
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
