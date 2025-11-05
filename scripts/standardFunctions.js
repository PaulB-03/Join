/**
 * List of CSS variable names used for contact background colors.
 *
 * @constant
 * @type {string[]}
 */
const CONTACT_BG_CSS_VARS = [
  "--contact-bg-blue",
  "--contact-bg-light-blue",
  "--contact-bg-light-green",
  "--contact-bg-purple",
  "--contact-bg-lilac",
  "--contact-bg-green",
  "--contact-bg-pink",
  "--contact-bg-red",
  "--contact-bg-rose",
  "--contact-bg-peach",
  "--contact-bg-orange",
  "--contact-bg-light-orange",
  "--contact-bg-dark-yellow",
  "--contact-bg-medium-yellow",
  "--contact-bg-yellow",
];

/**
 * Converts a full name into uppercase initials.
 *
 * @param {string} [name=""]
 * @returns {string}
 */
function initials(name = "") {
  const parts = String(name).trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts.at(-1)[0] : "";
  return (first + last).toUpperCase();
}

/**
 * Returns a CSS variable color string based on the character sum of the name.
 *
 * @param {string} [name=""]
 * @returns {string} e.g. `var(--contact-bg-blue)`
 */
function colorForName(name = "") {
  const trimmed = String(name).trim().toLowerCase();
  const sum = Array.from(trimmed).reduce((acc, ch) => acc + ch.codePointAt(0), 0);
  const varName = CONTACT_BG_CSS_VARS[sum % CONTACT_BG_CSS_VARS.length];
  return `var(${varName})`;
}
