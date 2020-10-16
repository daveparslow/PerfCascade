module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint', 'prettier', 'react', 'react-hooks'],
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/adjacent-overload-signatures': 'error',
    '@typescript-eslint/array-type': ['error', { default: 'array-simple', readonly: 'generic' }],
    '@typescript-eslint/ban-types': [
      'error',
      {
        types: {
          Object: {
            message: 'Avoid using the `Object` type, use `object` instead',
            fixWith: 'object'
          },
          Function: {
            message: 'Avoid using `Function` type, Prefer a specific function type, like `() => void`.'
          },
          Boolean: {
            message: 'Avoid using `Boolean` type, use `boolean` instead',
            fixWith: 'boolean'
          },
          Number: {
            message: 'Avoid using `Number` type, use `number` instead',
            fixWith: 'number'
          },
          String: {
            message: 'Avoid using `String` type, use `string` instead',
            fixWith: 'string'
          },
          Symbol: {
            message: 'Avoid using the `Symbol` type. use `symbol` instead',
            fixWith: 'symbol'
          }
        },
        extendDefaults: false
      }
    ],
    '@typescript-eslint/consistent-type-assertions': 'error',
    '@typescript-eslint/explicit-member-accessibility': [
      'error',
      { overrides: { accessors: 'off', constructors: 'off', parameterProperties: 'off', properties: 'off' } }
    ],
    '@typescript-eslint/member-ordering': ['error', { default: ['field', 'method'] }],
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
        leadingUnderscore: 'allow',
        trailingUnderscore: 'allow',
        custom: {
          regex:
            '\\bNumber\\b|\\bnumber\\b|\\bString\\b|\\bstring\\b|\\bBoolean\\b|\\bboolean\\b|\\bUndefined\\b|\\bundefined\\b|\\bany\\b',
          match: false
        }
      },
      {
        selector: 'typeLike',
        format: ['PascalCase'],
        leadingUnderscore: 'allow'
      }
    ],
    '@typescript-eslint/no-empty-interface': 'error',
    '@typescript-eslint/no-extraneous-class': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-misused-new': 'error',
    '@typescript-eslint/no-namespace': 'error',
    '@typescript-eslint/no-var-requires': 'error',
    '@typescript-eslint/no-require-imports': 'error',
    '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
    '@typescript-eslint/prefer-function-type': 'error',
    '@typescript-eslint/prefer-namespace-keyword': 'error',
    '@typescript-eslint/triple-slash-reference': 'error',
    '@typescript-eslint/typedef': [
      'error',
      {
        arrowParameter: false,
        memberVariableDeclaration: false
      }
    ],
    '@typescript-eslint/unified-signatures': 'error',
    'constructor-super': 'error',
    curly: 'error',
    'default-case': 'error',
    'dot-notation': 'error',
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    'guard-for-in': 'error',
    'max-classes-per-file': ['error', 1],
    'no-bitwise': 'error',
    'no-caller': 'error',
    'no-console': 'error',
    'no-cond-assign': ['error', 'always'],
    'no-debugger': 'error',
    'no-empty': 'error',
    'no-empty-function': ['error', { allow: ['constructors'] }],
    'no-eval': 'error',
    'no-fallthrough': 'error',
    'no-labels': 'error',
    'no-new-wrappers': 'error',
    'no-redeclare': 'error',
    'no-restricted-properties': [
      'error',
      {
        object: 'test',
        property: 'only'
      },
      {
        object: 'it',
        property: 'only'
      },
      {
        object: 'describe',
        property: 'only'
      }
    ],
    'no-shadow': 'error',
    'no-throw-literal': 'error',
    'no-undef-init': 'error',
    'no-unsafe-finally': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'one-var': ['error', 'never'],
    'prefer-const': ['error', { destructuring: 'all' }],
    'prettier/prettier': 'error',
    radix: 'error',
    'react/jsx-boolean-value': ['error', 'always'],
    'react/jsx-key': 'error',
    'react/jsx-no-bind': ['error', { allowArrowFunctions: true }],
    'react/self-closing-comp': 'error',
    'react/no-string-refs': 'error',
    'spaced-comment': [
      'error',
      'always',
      { markers: ['#region', '#endregion', '!', ',', '/'], block: { balanced: true } }
    ],
    'use-isnan': 'error'
  }
};
