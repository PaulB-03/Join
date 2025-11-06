/**
 * Adds a fallback message to the given array if no upcoming deadlines are found,
 * and hides the element with the ID "deadLineText".
 *
 * @param {Array} nextUpcomingDeadlineArray - The array to which a fallback message will be added.
 * @returns {number} The new length of the array after adding the fallback message.
 */
function stringIfNoDateFound(nextUpcomingDeadlineArray) {
  const deadlineText = document.getElementById("deadLineText");
  deadlineText.style.display = "none";
  return nextUpcomingDeadlineArray.push("Nothing to worry");
}

/**
 * Converts priorities to numbers and updates visuals.
 * @param {{prioritys:string[]}} datesObject
 * @param {string} nextUpcomingDeadline
 * @returns {void}
 */
function getHighestPriority(datesObject, nextUpcomingDeadline) {
  filterIrrelevantPrioritys(datesObject, nextUpcomingDeadline);
  const numberArray = [];
  for (let i = 0; i < datesObject.prioritys.length; i++) {
    const p = datesObject.prioritys[i];
    if (p === "urgent") numberArray.push(1);
  }
  sortNumberArray(numberArray);
}

/**
 * Keeps priorities matching the exact deadline.
 * @param {{dates:string[],prioritys:string[]}} datesObject
 * @param {string} nextUpcomingDeadline
 * @returns {{dates:string[],prioritys:string[]}}
 */
function filterIrrelevantPrioritys(datesObject, nextUpcomingDeadline) {
  for (let index = 0; index < datesObject.dates.length; index++) {
    let dateToFilter = new Date(datesObject.dates[index]);
    let nextDeadline = new Date(nextUpcomingDeadline);
    if (dateToFilter < nextDeadline || dateToFilter > nextDeadline) {
      datesObject.dates.splice(index, 1);
      datesObject.prioritys.splice(index, 1);
      index = -1;
    }
  }
  return datesObject;
}

/**
 * Sorts numeric priorities and applies visuals.
 * @param {number[]} numberArray
 * @returns {void}
 */
function sortNumberArray(numberArray) {
  let sortedArray = numberArray.sort();
  let highesValue = sortedArray[0];
}

/**
 * Resolves next upcoming or missed deadline and updates UI.
 * @param {{dates:string[],prioritys:string[]}} datesObject
 * @param {Object} responseToJson
 * @returns {void}
 */
function filterNextUpcomingDeadline(datesObject, responseToJson) {
  let arr = datesObject.dates.filter(verifyTheRightDate);
  if (arr.length === 0 && datesObject.dates.length === 0) stringIfNoDateFound(arr);
  else if (arr.length === 0 && datesObject.dates.length > 0) arr = missedDeadlineCall(arr, datesObject);
  let sorted = arr.sort();
  let nextUpcoming = sorted[0];
  countNextDeadlineDate(sorted, datesObject);
  getHighestPriority(datesObject, nextUpcoming);
  getDateFromDataBankAndChangeFormat(nextUpcoming, responseToJson);
}

/**
 * Sets "Missed Deadline" label.
 * @returns {void}
 */
function changeHtmlForMissedDeadlines() {
  let deadLineText = document.getElementById("deadLineText");
  deadLineText.innerHTML = "";
  deadLineText.innerHTML = "Missed Deadline";
}

/**
 * Handles missed deadlines and returns all dates.
 * @param {string[]} nextUpcomingDeadlineArray
 * @param {{dates:string[]}} datesObject
 * @returns {string[]}
 */
function missedDeadlineCall(nextUpcomingDeadlineArray, datesObject) {
  changeHtmlForMissedDeadlines();
  return (nextUpcomingDeadlineArray = datesObject.dates);
}

/**
 * Counts tasks sharing the nearest deadline date.
 * @param {string[]} sortedArray
 * @returns {void}
 */
function countNextDeadlineDate(sortedArray) {
  let deadLineCount = 0;
  for (let i = 0; i < sortedArray.length; i++) {
    if (sortedArray[0] == sortedArray[i] && sortedArray[0] !== "Nothing to worry") deadLineCount++;
  }
  changeInnerHTMlOfUrgencyBox(deadLineCount);
}

/**
 * Updates the count badge in urgency box.
 * @param {number} deadLineCount
 * @returns {void}
 */
function changeInnerHTMlOfUrgencyBox(deadLineCount) {
  let el = document.getElementById("urgencyCountBox");
  el.innerHTML = "";
  el.innerHTML = deadLineCount;
}

/**
 * Checks if a date string is today or in the future.
 * @param {string} date
 * @returns {boolean}
 */
function verifyTheRightDate(date) {
  const now = new Date();
  const formatedDate = returnTheRightDateFormat(now.getDate(), now.getMonth() + 1, now.getFullYear());
  return date >= formatedDate;
}

/**
 * Returns YYYY-MM-DD string for given parts (zero-padded).
 * @param {number} nowDay
 * @param {number} nowMonth
 * @param {number} nowYear
 * @returns {string}
 */
function returnTheRightDateFormat(nowDay, nowMonth, nowYear) {
  const dd = String(nowDay).padStart(2, "0");
  const mm = String(nowMonth).padStart(2, "0");
  return `${nowYear}-${mm}-${dd}`;
}

/**
 * Formats deadline as "Month Day, Year" and updates UI.
 * @param {string} deadLineDate
 * @param {Object} responseToJson
 * @returns {void}
 */
function getDateFromDataBankAndChangeFormat(deadLineDate) {
  let newFormat;
  if (deadLineDate !== "Nothing to worry") {
    let date = new Date(deadLineDate);
    newFormat = responseToJson.months[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
  } else newFormat = deadLineDate;
  changeInnerHtmlForDeadline(newFormat);
}

/**
 * Writes the deadline label into the urgency box.
 * @param {string} nextUpcomingDeadline
 * @returns {void}
 */
function changeInnerHtmlForDeadline(nextUpcomingDeadline) {
  let el = document.getElementById("urgencyDeadline");
  el.innerHTML = "";
  el.innerHTML = nextUpcomingDeadline;
}

/**
 * Updates the global urgent task count in the UI.
 * Only counts tasks with priority "urgent" that are not done.
 * @param {Object} data - Task data object from Firebase
 * @returns {void}
 */
function updateUrgentCountGlobal(data) {
  const tasks = data && data.tasks ? Object.values(data.tasks) : [];
  const urgentCount = tasks.filter((t) => String(t?.priority || "").toLowerCase() === "urgent" && t?.state !== "done").length;
  const countEl = document.getElementById("urgencyCountBox");
  const img = document.getElementById("urgencyImg");
  const container = document.getElementById("urgencyImgContainer");
  if (!countEl || !img || !container) return;
  if (urgentCount > 0) {
    countEl.textContent = urgentCount;
  } else {
    countEl.textContent = "0";
  }
}
