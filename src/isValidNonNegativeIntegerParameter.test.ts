import isValidNonNegativeIntegerParameter from './isValidNonNegativeIntegerParameter';

describe('isValidNonNegativeIntegerParameter', () => {
  ([
    null,
    undefined,
    '',
    -1,
    -Infinity,
    NaN,
  ]).forEach(x => {
    it(`recoginses ${x} as invalid`, () => {
      expect(isValidNonNegativeIntegerParameter(x)).toBe(false)
    })
  });


  ([
    0,
    '0',
    1,
    '1',
    '99999'
  ]).forEach(x => {
    it(`recognises ${x} as valid`, () => {
      expect(isValidNonNegativeIntegerParameter(x)).toBe(true);
    })
  })
})