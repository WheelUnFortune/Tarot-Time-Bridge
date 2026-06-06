const globals = require("globals");

module.exports = [
  {
    ignores: ["node_modules/**", "docs/**", "eslint.config.js", "stylelint.config.js", ".htmlhintrc"],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "script",
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^[_$]" }],
      "no-console": "off",
      "eqeqeq": ["error", "smart"],
      "prefer-const": "warn",
      "no-var": "error",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-eval": "error",
    },
  },
  {
    files: ["test-tz.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
  },
];
