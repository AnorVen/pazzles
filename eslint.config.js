const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  {
    ignores: ["node_modules/**", "dist*/**", ".build-checks/**", "vendor/**"],
  },
  js.configs.recommended,
  {
    files: ["script.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        headbreaker: "readonly",
      },
    },
  },
  {
    files: ["electron/**/*.js", "scripts/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: globals.node,
    },
  },
];
