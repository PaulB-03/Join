// If no deadline found, push "Nothing to worry"
/**
 * Sets low urgency visuals and pushes fallback text.
 * @param {string[]} nextUpcomingDeadlineArray
 * @returns {number} New length of array
 */
// function stringIfNoDateFound(nextUpcomingDeadlineArray) {
//     urgencyImgContainer.style = "background-color:  var(--button-low)";
//     urgencyImg.src = "../assets/svg/check_2.svg";
//     return nextUpcomingDeadlineArray.push("Nothing to worry");
//   }

function stringIfNoDateFound(nextUpcomingDeadlineArray) {
  const urgencyImgContainer = document.getElementById("urgencyImgContainer");
  const urgencyImg = document.getElementById("urgencyImg");

  // if (urgencyImgContainer) urgencyImgContainer.style.backgroundColor = "transparent";
  // if (urgencyImg) urgencyImg.style.display = "none";
  return nextUpcomingDeadlineArray.push("Nothing to worry");
}

// Converts priority strings to numbers and sorts them
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
    else if (p === "medium") numberArray.push(2);
    else if (p === "low") numberArray.push(3);
  }
  sortNumberArray(numberArray);
}

// filters and cuts out the unnecessary prioritys
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

// Sorts numbers and gets the highest priority
/**
 * Sorts numeric priorities and applies visuals.
 * @param {number[]} numberArray
 * @returns {void}
 */
function sortNumberArray(numberArray) {
  let sortedArray = numberArray.sort();
  let highesValue = sortedArray[0];
  // changeBackgroundColorOfUrgencyImg(highesValue);
  // changeUrgencyImg(highesValue);
}

// Changes background color of urgency image based on priority value
/**
 * Sets background color for urgency indicator.
 * @param {1|2|3} highesValue
 * @returns {void}
 */
// function changeBackgroundColorOfUrgencyImg(highesValue) {
//   let urgencyImgContainer = document.getElementById("urgencyImgContainer");
//   if (highesValue === 1) urgencyImgContainer.style = "background-color:  var(--button-urgent)";
//   else if (highesValue === 2) urgencyImgContainer.style = "background-color:  var(--button-medium)";
//   else if (highesValue === 3) urgencyImgContainer.style = "background-color:  var(--button-low)";
// }

// function changeBackgroundColorOfUrgencyImg(highesValue) {
// const urgencyImgContainer = document.getElementById("urgencyImgContainer");
// if (!urgencyImgContainer) return;
//
// if (highesValue === 1) {
//
// urgencyImgContainer.style.backgroundColor = "var(--button-urgent)";
// } else {
//
// urgencyImgContainer.style.backgroundColor = "transparent";
// }
// }

// Updates the urgency image depending on the numeric priority
/**
 * Chooses urgency icon by numeric priority.
 * @param {1|2|3} highesValue
 * @returns {void}
 */
// function changeUrgencyImg(highesValue) {
//   let urgencyImg = document.getElementById("urgencyImg");
//   if (highesValue === 1) urgencyImg.src = "../assets/svg/double_arrow_up.svg";
//   else if (highesValue === 2) urgencyImg.src = "../assets/svg/double_lines_white.svg";
//   else if (highesValue === 3) urgencyImg.src = "../assets/svg/double_arrow_down_white.svg";
// }

// function changeUrgencyImg(highesValue) {
// const urgencyImg = document.getElementById("urgencyImg");
// if (!urgencyImg) return;
//
// if (highesValue === 1) {
// urgencyImg.style.display = "";
// urgencyImg.src = "../assets/svg/double_arrow_up.svg";
// } else {
// urgencyImg.style.display = "none";
// }
// }

// Filters for next upcoming deadline and for missed deadLines
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

// changes Html Text in DeadlineBox p element
/**
 * Sets "Missed Deadline" label.
 * @returns {void}
 */
function changeHtmlForMissedDeadlines() {
  let deadLineText = document.getElementById("deadLineText");
  deadLineText.innerHTML = "";
  deadLineText.innerHTML = "Missed Deadline";
}

// handles missed deadlines by setting HTML
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

// Counts how many tasks share the same nearest deadline
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

// Updates the deadline count in the urgency box
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

// Checks if a date is today or in the future
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

// date: month and day has to be at least two digit -> adds 0 to date day/month if smaller then 10
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

// Converts deadline into "Month Day, Year" format
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

// Updates deadline text in the urgency box
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
 * Forces the display or hiding of the urgency icon
 * based on whether there are any tasks with priority "urgent".
 * This runs independently from the next deadline calculation
 * to ensure the summary always reflects global urgency status.
 *
 * @param {Object} data - The full Firebase response object containing all tasks.
 */
// function toggleUrgentIconByGlobalUrgent(data) {
// const tasks = data && data.tasks ? Object.values(data.tasks) : [];
// const hasUrgent = tasks.some((t) => String(t?.priority || "").toLowerCase() === "urgent");
//
// const img = document.getElementById("urgencyImg");
// const container = document.getElementById("urgencyImgContainer");
// if (!img || !container) return;
//
// if (hasUrgent) {
// img.style.display = "";
// img.src = "../assets/svg/double_arrow_up.svg";
// container.style.backgroundColor = "var(--button-urgent)";
// } else {
// img.style.display = "none";
// container.style.backgroundColor = "transparent";
// }
// }

/**
 * Updates the global urgent task counter in the summary.
 * Displays the count only if there is at least one urgent task.
 * Hides icon, background, and count when there are none.
 *
 * @param {Object} data - The full Firebase response object containing all tasks.
 */
function updateUrgentCountGlobal(data) {
  const tasks = data && data.tasks ? Object.values(data.tasks) : [];
  const urgentCount = tasks.filter((t) => String(t?.priority || "").toLowerCase() === "urgent").length;

  const countEl = document.getElementById("urgencyCountBox");
  const img = document.getElementById("urgencyImg");
  const container = document.getElementById("urgencyImgContainer");
  if (!countEl || !img || !container) return;

  if (urgentCount > 0) {
    // img.style.display = "";
    // img.src = "../assets/svg/double_arrow_up.svg";
    // container.style.backgroundColor = "var(--button-urgent)";
    countEl.textContent = urgentCount;
  } else {
    // img.style.display = "none";
    // container.style.backgroundColor = "transparent";
    countEl.textContent = "0";
  }
}
