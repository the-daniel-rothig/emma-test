import isValidDateParameter from "./isValidDateParameter"

describe('isValidDateParameter', () => {
  ([
    '2000',
    100,
    'foo',
    '2000-01-32',
    null,
    undefined,
    ''
  ]).forEach(x => {
    it(`recoginses ${x} as invalid`, () => {
      expect(isValidDateParameter(x)).toBe(false)
    })
  });


  ([
    '1970-01-01',
    '2020-03-20',
    '2099-12-31'
  ]).forEach(x => {
    it(`recognises ${x} as valid`, () => {
      expect(isValidDateParameter(x)).toBe(true);
    })
  })
})