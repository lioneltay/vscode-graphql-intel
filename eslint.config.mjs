import typescriptEslint from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"
import prettier from "eslint-plugin-prettier"

export default [
  {
    files: ["**/*.ts"],
  },
  {
    plugins: {
      "@typescript-eslint": typescriptEslint,
      prettier: prettier,
    },

    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",
    },

    rules: {
      "@typescript-eslint/naming-convention": [
        "warn",
        {
          selector: "import",
          format: ["camelCase", "PascalCase"],
        },
      ],
      "prettier/prettier": "warn",
      curly: "warn",
      eqeqeq: "warn",
      "no-throw-literal": "warn",
      semi: "warn",
    },
  },
  {
    rules: {
      // Disable rules that conflict with Prettier
      "arrow-body-style": "off",
      "prefer-arrow-callback": "off",
      "prettier/prettier": "warn",
    },
  },
]
