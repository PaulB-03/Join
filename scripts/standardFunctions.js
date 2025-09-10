


// call this function with a name (string of first and last name) to get the initials
// gets the initials for the profile picture,  called by contactRow
function initials(name) {
  const parts = (name || "").trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// call this function with a name (string of first and last name) to get a color
// function to give the same color for the same name everytime, called by contactRow
function colorForName(name = "") {
  //use empty string if no name is found
  const sum = [...name.trim().toLowerCase()] //convert name to lower case letters and split into characters
    .reduce((acc, ch) => acc + ch.codePointAt(0), 0); // sum the unicode values of each character
  return `var(${COLOR_VARS[sum % COLOR_VARS.length]})`; // use the sum from the unicode values to select a color
}