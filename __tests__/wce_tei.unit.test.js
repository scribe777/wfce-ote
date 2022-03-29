
const wce_tei = require('../wce-ote/wce_tei');

// addArrows

test('replaces x with left arrow at end of string', () => {
  expect(wce_tei.addArrows('P45x')).toBe('P45→');
});

test('does not replace x with left arrow if x not at end of string', () => {
  expect(wce_tei.addArrows('Px45')).toBe('Px45');
});

test('replaces y with down arrow at end of string', () => {
  expect(wce_tei.addArrows('P45y')).toBe('P45↓');
});

test('does not replace y with down arrow if y not at end of string', () => {
  expect(wce_tei.addArrows('Py45')).toBe('Py45');
});

// removeArrows

test('replaces left arrow at end of string with x', () => {
  expect(wce_tei.removeArrows('P45→')).toBe('P45x');
});

test('does not replace left arrow if arrow not at end of string', () => {
  expect(wce_tei.removeArrows('P→45')).toBe('P→45');
});

test('replaces down arrow at end of string with y', () => {
  expect(wce_tei.removeArrows('P45↓')).toBe('P45y');
});

test('does not replace down arrow if arrow not at end of string', () => {
  expect(wce_tei.removeArrows('P↓45')).toBe('P↓45');
});
