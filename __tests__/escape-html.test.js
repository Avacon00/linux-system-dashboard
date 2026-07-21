const { escapeHtml } = require('../escape-html');

describe('escapeHtml', () => {
  test('escaped HTML-Sonderzeichen', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;'
    );
  });

  test('escaped Anführungszeichen (relevant für Attribut-Kontexte)', () => {
    expect(escapeHtml(`"foo" & 'bar'`)).toBe('&quot;foo&quot; &amp; &#39;bar&#39;');
  });

  test('lässt normalen Text unverändert', () => {
    expect(escapeHtml('firefox-118.0.2')).toBe('firefox-118.0.2');
  });

  test('behandelt null/undefined als leeren String', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  test('wandelt Zahlen in Strings um', () => {
    expect(escapeHtml(42)).toBe('42');
  });
});
