import {
  gamePage,
  howToPlayPage,
  leadersPage,
  menuPage,
  settingsPage,
} from "./dom.js";

const pages = {
  menu: menuPage,
  settings: settingsPage,
  leaders: leadersPage,
  howToPlay: howToPlayPage,
  game: gamePage,
};

let activePage = "menu";

export function showPage(pageName) {
  Object.entries(pages).forEach(([name, element]) => {
    const isActive = name === pageName;
    element.hidden = !isActive;
    element.classList.toggle("page--active", isActive);
  });

  activePage = pageName;
}

export function getActivePage() {
  return activePage;
}
