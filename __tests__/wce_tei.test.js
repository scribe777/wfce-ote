const addArrows = require('../wce-ote/wce_tei');

test('replaces x with left arrow at end of string', () => {
  expect(addArrows('P45x')).toBe('P45→');
});

test('does not replace x with left arrow if x not at end of string', () => {
  expect(addArrows('Px45')).toBe('Px45');
});

test('replaces y with down arrow at end of string', () => {
  expect(addArrows('P45y')).toBe('P45↓');
});

test('does not replace y with down arrow if y not at end of string', () => {
  expect(addArrows('Py45')).toBe('Py45');
});
