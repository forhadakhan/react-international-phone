import { defaultCountries } from '../../../data/countryData';
import { CountryIso2 } from '../../../types';
import { parseCountry } from '../../countryUtils';
import { validatePhone } from '../validatePhone';

const getCountry = (iso2: CountryIso2) => {
  const country = defaultCountries.find(
    (country) => parseCountry(country).iso2 === iso2,
  );
  if (!country) return;
  return parseCountry(country);
};

describe('validatePhone', () => {
  test('should return validated country', () => {
    expect(validatePhone('+1 (401) 234-5678')).toMatchObject({
      country: getCountry('us'),
    });

    expect(validatePhone('')).toMatchObject({
      country: undefined,
    });

    expect(validatePhone('+999')).toMatchObject({
      country: undefined,
    });

    expect(validatePhone('+380')).toMatchObject({
      country: getCountry('ua'),
    });
  });

  test('should handle phone length match', () => {
    expect(validatePhone('+1 (999) 999-9999')).toMatchObject({
      lengthMatch: true,
    });

    expect(validatePhone('')).toMatchObject({
      lengthMatch: false,
    });

    expect(validatePhone('+')).toMatchObject({
      lengthMatch: false,
    });

    expect(validatePhone('+380')).toMatchObject({
      lengthMatch: false,
    });

    expect(validatePhone('+1 (999) 999-')).toMatchObject({
      lengthMatch: false,
    });

    // allow phone number overflow
    expect(validatePhone('+1 (999) 999-99999')).toMatchObject({
      lengthMatch: true,
    });
  });

  test('should handle area code match', () => {
    expect(validatePhone('+1 (402) 999-9999')).toMatchObject({
      country: getCountry('us'),
      areaCodeMatch: true,
    });

    expect(validatePhone('+1 (403) 999-9999')).toMatchObject({
      country: getCountry('ca'),
      areaCodeMatch: true,
    });

    expect(validatePhone('+1 (403)')).toMatchObject({
      country: getCountry('ca'),
      areaCodeMatch: true,
    });

    expect(validatePhone('+1 (999) 999-9999')).toMatchObject({
      country: getCountry('us'),
      areaCodeMatch: false,
    });

    expect(validatePhone('+1')).toMatchObject({
      areaCodeMatch: false,
    });

    // returns undefined if the country has no area codes or no dial code is specified
    expect(validatePhone('+380 (99) 999 99 99')).toMatchObject({
      areaCodeMatch: undefined,
    });

    expect(validatePhone('')).toMatchObject({
      areaCodeMatch: undefined,
    });

    expect(validatePhone('+')).toMatchObject({
      areaCodeMatch: undefined,
    });
  });

  test('should handle formatting match', () => {
    expect(validatePhone('+1 (999) 999-9999')).toMatchObject({
      formatMatch: true,
    });

    expect(validatePhone('')).toMatchObject({
      formatMatch: false,
    });

    expect(validatePhone('+')).toMatchObject({
      formatMatch: false,
    });

    expect(validatePhone('+380')).toMatchObject({
      formatMatch: false,
    });

    expect(validatePhone('+1 (999) 999-')).toMatchObject({
      formatMatch: false,
    });

    expect(validatePhone('19999999999')).toMatchObject({
      formatMatch: false,
    });

    expect(validatePhone('+19999999999')).toMatchObject({
      formatMatch: false,
    });

    expect(validatePhone('+1 (999) 999-999')).toMatchObject({
      formatMatch: false,
    });

    expect(validatePhone('1 (999) 999-999')).toMatchObject({
      formatMatch: false,
    });

    expect(validatePhone('+1 (999) 999-99999')).toMatchObject({
      formatMatch: true,
    });
  });

  test('should return isValid', () => {
    expect(validatePhone('+1 (201) 234-5678')).toMatchObject({
      isValid: true,
    });

    expect(validatePhone('1 (201) 234-5678')).toMatchObject({
      isValid: true,
    });

    expect(validatePhone('+12012345678')).toMatchObject({
      isValid: true,
    });

    expect(validatePhone('+1 201 234 5678')).toMatchObject({
      isValid: true,
    });

    expect(validatePhone('+1 (402) 999-9999-')).toMatchObject({
      isValid: true,
    });

    expect(validatePhone('+1 (402) 999-99999')).toMatchObject({
      isValid: true,
    });

    expect(validatePhone('+1 (402) 999-999')).toMatchObject({
      isValid: false,
    });

    expect(validatePhone('')).toMatchObject({
      isValid: false,
    });

    expect(validatePhone('+1 ')).toMatchObject({
      isValid: false,
    });
  });

  test('should support config.countries', () => {
    const balticCountries = defaultCountries.filter((c) => {
      return ['lt', 'lv', 'ee'].includes(parseCountry(c).iso2);
    });

    expect(
      validatePhone('+1 (201) 234-5678', { countries: balticCountries }),
    ).toMatchObject({
      country: undefined,
      areaCodeMatch: undefined,
      lengthMatch: false,
      isValid: false,
    });

    expect(
      validatePhone('+372 9999 999999', { countries: balticCountries }),
    ).toMatchObject({
      country: getCountry('ee'),
      areaCodeMatch: undefined,
      lengthMatch: true,
      isValid: true,
    });

    expect(
      validatePhone('+371 99 999 999', { countries: balticCountries }),
    ).toMatchObject({
      country: getCountry('lv'),
      areaCodeMatch: undefined,
      lengthMatch: true,
      isValid: true,
    });

    expect(
      validatePhone('+1 (201) 234-5678', {
        countries: defaultCountries.filter(
          (country) => parseCountry(country).iso2 !== 'us', // remove us
        ),
      }),
    ).toMatchObject({
      country: getCountry('ca'),
      areaCodeMatch: false,
      lengthMatch: true,
      isValid: true,
    });
  });

  test('should support config.prefix', () => {
    expect(validatePhone('+1 (201) 234-5678', { prefix: '' })).toMatchObject({
      country: getCountry('us'),
      areaCodeMatch: true,
      lengthMatch: true,
      isValid: true,
      formatMatch: false,
    });

    expect(validatePhone('1 (201) 234-5678', { prefix: '' })).toMatchObject({
      country: getCountry('us'),
      areaCodeMatch: true,
      lengthMatch: true,
      isValid: true,
      formatMatch: true,
    });

    expect(validatePhone('-1 (201) 234-5678', { prefix: '-' })).toMatchObject({
      country: getCountry('us'),
      areaCodeMatch: true,
      lengthMatch: true,
      isValid: true,
      formatMatch: true,
    });
  });

  test('should support config.charAfterDialCode', () => {
    expect(
      validatePhone('+1 (201) 234-5678', { charAfterDialCode: '' }),
    ).toMatchObject({
      country: getCountry('us'),
      areaCodeMatch: true,
      lengthMatch: true,
      isValid: true,
      formatMatch: false,
    });

    expect(
      validatePhone('+1(201) 234-5678', { charAfterDialCode: '' }),
    ).toMatchObject({
      country: getCountry('us'),
      areaCodeMatch: true,
      lengthMatch: true,
      isValid: true,
      formatMatch: true,
    });
  });

  test('should support config.defaultMask', () => {
    expect(
      validatePhone('+370 1234 56789', {
        defaultMask: '.... .....',
        defaultMaskMinPhoneLength: 11,
      }),
    ).toMatchObject({
      country: getCountry('lt'),
      areaCodeMatch: undefined,
      lengthMatch: true,
      formatMatch: true,
      isValid: true,
    });

    expect(
      validatePhone('+370 123456789000', {
        defaultMask: '.... .... ....',
        defaultMaskMinPhoneLength: 11,
      }),
    ).toMatchObject({
      country: getCountry('lt'),
      areaCodeMatch: undefined,
      lengthMatch: true,
      formatMatch: false,
      isValid: true,
    });

    expect(
      validatePhone('+370 1234 5678 90', {
        defaultMask: '.... .... ....',
        defaultMaskMinPhoneLength: 11,
      }),
    ).toMatchObject({
      country: getCountry('lt'),
      areaCodeMatch: undefined,
      lengthMatch: true,
      formatMatch: true,
      isValid: true,
    });

    expect(
      validatePhone('+370 1234 567', {
        defaultMask: '.... .... ....',
        defaultMaskMinPhoneLength: 11,
      }),
    ).toMatchObject({
      country: getCountry('lt'),
      areaCodeMatch: undefined,
      lengthMatch: false,
      formatMatch: true,
      isValid: false,
    });
  });

  describe('should support config.country', () => {
    test('should work with matched dial code', () => {
      expect(validatePhone('+1 999999999999', { country: 'do' })).toMatchObject(
        {
          country: getCountry('do'),
          areaCodeMatch: undefined,
          lengthMatch: true,
          isValid: true,
        },
      );

      expect(validatePhone('+1', { country: 'pr' })).toMatchObject({
        country: getCountry('pr'),
        areaCodeMatch: undefined,
        lengthMatch: false,
        isValid: false,
      });

      expect(
        validatePhone('+1 (999) 999-9999', { country: 'us' }),
      ).toMatchObject({
        country: getCountry('us'),
        areaCodeMatch: false,
        lengthMatch: true,
        isValid: true,
      });

      expect(
        validatePhone('+1 (999) 999-9999', { country: 'ca' }),
      ).toMatchObject({
        country: getCountry('ca'),
        areaCodeMatch: false,
        lengthMatch: true,
        isValid: true,
      });

      expect(
        validatePhone('+380 (99) 999 99 99', { country: 'ua' }),
      ).toMatchObject({
        country: getCountry('ua'),
        areaCodeMatch: undefined,
        lengthMatch: true,
        formatMatch: true,
        isValid: true,
      });
    });

    test('should use country from config.country for validation', () => {
      expect(
        validatePhone('+1 (201) 567-8900', { country: 'ua' }),
      ).toMatchObject({
        country: getCountry('ua'),
        areaCodeMatch: undefined,
        lengthMatch: false,
        isValid: false,
      });

      expect(
        validatePhone('+380 (99) 999 99 99', { country: 'us' }),
      ).toMatchObject({
        country: getCountry('us'),
        areaCodeMatch: false,
        lengthMatch: true,
        isValid: false,
      });

      expect(
        validatePhone('+1 (204) 567-8900', { country: 'us' }),
      ).toMatchObject({
        country: getCountry('us'),
        areaCodeMatch: false,
        lengthMatch: true,
        isValid: true,
      });
    });
  });

  describe('should return dialCodeMatch', () => {
    test('should return true for valid phone', () => {
      expect(validatePhone('+1 (204) 567-8900')).toMatchObject({
        country: getCountry('ca'),
        dialCodeMatch: true,
        areaCodeMatch: true,
        lengthMatch: true,
        isValid: true,
      });
    });

    test('should return false for invalid phone', () => {
      expect(validatePhone('+99999999')).toMatchObject({
        country: undefined,
        dialCodeMatch: false,
        areaCodeMatch: undefined,
        lengthMatch: false,
        isValid: false,
      });
    });

    test('should work with config.country', () => {
      expect(
        validatePhone('+1 (201) 567-8900', { country: 'ua' }),
      ).toMatchObject({
        country: getCountry('ua'),
        dialCodeMatch: false,
        areaCodeMatch: undefined,
        lengthMatch: false,
        isValid: false,
      });

      expect(
        validatePhone('+1 (201) 567-8900', { country: 'us' }),
      ).toMatchObject({
        country: getCountry('us'),
        dialCodeMatch: true,
        areaCodeMatch: true,
        lengthMatch: true,
        isValid: true,
      });
    });
  });

  test('should work with all default countries', () => {
    for (const c of defaultCountries) {
      const country = parseCountry(c);

      const phone = `+${country.dialCode} ${
        country.format?.replace(/\./g, '9') || '9999999999'
      }`;

      const validationResult = validatePhone(phone);

      expect(validationResult).toMatchObject({
        dialCodeMatch: true,
        lengthMatch: true,
        isValid: true,
      });
    }
  });
});
