/**
 * Auth usernames: 5–15 chars, /^[a-zA-Z0-9_]+$/ (see RegisterUserRequestDto).
 * @param {string} tag Short prefix (letters/digits/underscore only), max ~3 chars.
 * @param {string | number} [salt] Extra uniqueness (e.g. client index).
 */
export function makeLoadTestUsername(tag = "lt", salt = "") {
  const prefix =
    String(tag)
      .replace(/[^a-zA-Z0-9_]/g, "") // ^ inverts the match by match everyhing that is not alpha-numberic
      .slice(0, 3) || "lt"; // "hello there! -> hellothere -> hel"

  const saltClean = String(salt)
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 4);

  const noise =
    `${saltClean}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`.replace(
      /[^a-z0-9]/gi,
      "",
    );

  let username = `${prefix}_${noise}`;

  username = username.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 15);

  if (username.length < 5) {
    username = `${username}_xxxx`.slice(0, 15);
  }

  return username;
}
