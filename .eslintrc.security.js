module.exports = {
  extends: [
    'eslint:recommended',
    '@eslint/js/recommended'
  ],
  env: {
    node: true,
    es2022: true,
    browser: true
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  rules: {
    // Security-focused rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-alert': 'error',
    'no-console': 'warn',
    
    // Prevent potential security issues
    'no-var': 'error',
    'prefer-const': 'error',
    'no-unused-vars': 'error',
    'no-undef': 'error',
    
    // Code quality rules
    'eqeqeq': 'error',
    'curly': 'error',
    'no-multiple-empty-lines': 'error',
    'no-trailing-spaces': 'error',
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    'indent': ['error', 2],
    
    // Security best practices
    'no-unsafe-finally': 'error',
    'no-unsafe-negation': 'error',
    'no-unsafe-optional-chaining': 'error',
    'no-unreachable': 'error',
    'no-unreachable-loop': 'error',
    'no-unsafe-assignment': 'error',
    'no-unsafe-call': 'error',
    'no-unsafe-member-access': 'error',
    'no-unsafe-return': 'error'
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true
      },
      rules: {
        'no-console': 'off'
      }
    }
  ]
};


