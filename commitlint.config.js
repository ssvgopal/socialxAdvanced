module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // new feature
        'fix',      // bug fix
        'docs',     // documentation
        'style',    // formatting, missing semi colons, etc; no code change
        'refactor', // refactoring production code
        'test',     // adding tests, refactoring test; no production code change
        'chore',    // updating build tasks, package manager configs, etc; no production code change
        'perf',     // performance improvements
        'ci',       // CI related changes
        'build',    // build system or external dependencies
        'revert'    // revert changes
      ]
    ],
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
    'subject-full-stop': [2, 'never', '.'],
    'body-leading-blank': [1, 'always'],
    'body-max-line-length': [2, 'always', 100],
    'footer-leading-blank': [1, 'always'],
    'footer-max-line-length': [2, 'always', 100]
  }
};