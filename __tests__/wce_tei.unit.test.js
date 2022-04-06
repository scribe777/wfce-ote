const wce_tei = require('../wce-ote/wce_tei');

// addArrows
test('replaces x and y with correct arrows at end of Papyri sigla', () => {
  expect(wce_tei.addArrows('P45x')).toBe('P45→');
  expect(wce_tei.addArrows('Px45')).toBe('Px45');
  expect(wce_tei.addArrows('P45y')).toBe('P45↓');
  expect(wce_tei.addArrows('Py45')).toBe('Py45');
});

// removeArrows
test('replaces arrows with x and y at end of Papyri sigla', () => {
  expect(wce_tei.removeArrows('P45→')).toBe('P45x');
  expect(wce_tei.removeArrows('P→45')).toBe('P→45');
  expect(wce_tei.removeArrows('P45↓')).toBe('P45y');
  expect(wce_tei.removeArrows('P↓45')).toBe('P↓45');
  // legacy support
  expect(wce_tei.removeArrows('P45↑')).toBe('P45y');
  expect(wce_tei.removeArrows('P↑45')).toBe('P↑45');
});

// startHasSpace
test ('string starts with a space', () => {
  expect(wce_tei.startHasSpace(' string')).toBe(true);
  expect(wce_tei.startHasSpace(' string ')).toBe(true);
  expect(wce_tei.startHasSpace('string')).toBe(undefined);
  expect(wce_tei.startHasSpace('st ring')).toBe(undefined);
  expect(wce_tei.startHasSpace('string ')).toBe(undefined);

});

// endHasSpace
test ('string ends with a space', () => {
  expect(wce_tei.endHasSpace('string ')).toBe(true);
  expect(wce_tei.endHasSpace(' string ')).toBe(true);
  expect(wce_tei.endHasSpace('string')).toBe(undefined);
  expect(wce_tei.endHasSpace('st ring')).toBe(undefined);
  expect(wce_tei.endHasSpace(' string')).toBe(undefined);
});


//NOT WORKING MAY NEED A MOCK can't find alert
// error handling (this one needs to change because code needs to change)
// test('errors are handled', () => {
//   let alertFunction = jest.spyOn(wce_tei, 'zeigeFehler').mockImplementation(() => {});
//   wce_tei.Fehlerbehandlung('error message', 'datei', 'zeilen');
//   expect(alertFunction).toHaveBeenCalled();
// });
