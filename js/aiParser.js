/**
 * Advanced AI Smart Input Parser for Taskly (FR-08)
 * Parses natural language input to derive Title, Category, Priority, Date, and Time.
 * Supports typos ("tomorow"), explicit dates ("2026-08-25", "15/08/2026", "Aug 25th"),
 * week days ("this friday", "next monday"), and strict time detection (AM/PM, HH:MM, HH:MM:SS).
 */

export const AIParser = {
  parse(inputString) {
    if (!inputString || !inputString.trim()) return null;

    const rawInput = inputString.trim();
    let text = rawInput;
    let lower = text.toLowerCase();

    let category = 'Personal';
    let priority = 'Medium';
    let parsedTime = '12:00'; // Default noon
    let parsedDate = new Date();
    let dateFound = false;

    // 1. Detect Category & Priority
    if (/\b(work|office|job|shift|client|business|company|boss|career)\b/i.test(lower)) {
      category = 'Work';
      priority = 'High';
    } else if (/\b(exam|test|quiz|midterm|final|eval|assessment)\b/i.test(lower)) {
      category = 'Exam';
      priority = 'High';
    } else if (/\b(assignment|homework|essay|paper|lab|submission|read|reading|thesis)\b/i.test(lower)) {
      category = 'Assignment';
      priority = 'High';
    } else if (/\b(project|meeting|presentation|sync|demo|brainstorm|standup|sprint)\b/i.test(lower)) {
      category = 'Project';
      priority = 'Medium';
    }

    // Explicit Priority keywords override
    if (/\b(urgent|high priority|asap|important)\b/i.test(lower)) {
      priority = 'High';
    } else if (/\b(low priority|minor|someday|optional)\b/i.test(lower)) {
      priority = 'Low';
    }

    // 2. Parse Time (Strictly AM/PM, HH:MM / HH:MM:SS, or "at X")
    let timeMatchedStr = '';
    
    // Pattern A: AM/PM times (e.g. "3pm", "3 pm", "3:30pm", "11:59 pm", "9:00am", "3a.m.", "5p.m.", "12:00:00 pm")
    const amPmMatch = lower.match(/(?:at\s+)?\b(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(am|pm|a\.m\.|p\.m\.)\b/i);

    // Pattern B: 24-hour / HH:MM or HH:MM:SS formats (e.g. "14:30", "09:00", "23:59:00", "08:15:00")
    const colonMatch = lower.match(/(?:at\s+)?\b([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?\b/i);

    // Pattern C: "at X" format (e.g. "at 3", "at 15")
    const atMatch = lower.match(/\bat\s+(\d{1,2})\b/i);

    if (amPmMatch) {
      let hours = parseInt(amPmMatch[1], 10);
      let minutes = amPmMatch[2] ? parseInt(amPmMatch[2], 10) : 0;
      let meridiem = amPmMatch[3].replace(/\./g, '').toLowerCase();

      if (hours >= 1 && hours <= 12) {
        if (meridiem === 'pm' && hours < 12) hours += 12;
        if (meridiem === 'am' && hours === 12) hours = 0;
        const hh = String(hours).padStart(2, '0');
        const mm = String(minutes).padStart(2, '0');
        parsedTime = `${hh}:${mm}`;
        timeMatchedStr = amPmMatch[0];
      }
    } else if (colonMatch) {
      let hours = parseInt(colonMatch[1], 10);
      let minutes = parseInt(colonMatch[2], 10);
      const hh = String(hours).padStart(2, '0');
      const mm = String(minutes).padStart(2, '0');
      parsedTime = `${hh}:${mm}`;
      timeMatchedStr = colonMatch[0];
    } else if (atMatch) {
      let hours = parseInt(atMatch[1], 10);
      if (hours >= 1 && hours <= 24) {
        if (hours < 7) hours += 12;
        const hh = String(hours).padStart(2, '0');
        parsedTime = `${hh}:00`;
        timeMatchedStr = atMatch[0];
      }
    }

    // 3. Parse Dates (Relative, Literal ISO, US/UK numeric, Month Names)
    const today = new Date();
    let datePhraseToRemove = '';

    // Relative Days (including common typos like "tomorow", "tmrw", "tday")
    if (/\b(today|tday|tonight)\b/i.test(lower)) {
      parsedDate = new Date(today);
      dateFound = true;
      datePhraseToRemove = lower.match(/\b(today|tday|tonight)\b/i)[0];
    } else if (/\b(tomorrow|tomorow|tommorrow|tommow|tmrw|tmo)\b/i.test(lower)) {
      parsedDate = new Date(today);
      parsedDate.setDate(today.getDate() + 1);
      dateFound = true;
      datePhraseToRemove = lower.match(/\b(tomorrow|tomorow|tommorrow|tommow|tmrw|tmo)\b/i)[0];
    } else if (/\b(day after tomorrow)\b/i.test(lower)) {
      parsedDate = new Date(today);
      parsedDate.setDate(today.getDate() + 2);
      dateFound = true;
      datePhraseToRemove = 'day after tomorrow';
    }

    // "in X days"
    if (!dateFound) {
      const inDaysMatch = lower.match(/\bin\s+(\d+)\s+days?\b/i);
      if (inDaysMatch) {
        const days = parseInt(inDaysMatch[1], 10);
        parsedDate = new Date(today);
        parsedDate.setDate(today.getDate() + days);
        dateFound = true;
        datePhraseToRemove = inDaysMatch[0];
      }
    }

    // Days of the week (e.g. "next monday", "this friday", "on tuesday", "friday")
    if (!dateFound) {
      const dayMap = { sunday:0, sun:0, monday:1, mon:1, tuesday:2, tue:2, wednesday:3, wed:3, thursday:4, thu:4, friday:5, fri:5, saturday:6, sat:6 };
      const dayMatch = lower.match(/\b(?:next|this|on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i);
      if (dayMatch) {
        const dayName = dayMatch[1].toLowerCase();
        if (dayMap[dayName] !== undefined) {
          parsedDate = getNextDayOfWeek(today, dayMap[dayName]);
          dateFound = true;
          datePhraseToRemove = dayMatch[0];
        }
      }
    }

    // Literal ISO dates: YYYY-MM-DD or YYYY/MM/DD (e.g. 2026-08-25)
    if (!dateFound) {
      const isoMatch = lower.match(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/);
      if (isoMatch) {
        const yyyy = parseInt(isoMatch[1], 10);
        const mm = parseInt(isoMatch[2], 10) - 1;
        const dd = parseInt(isoMatch[3], 10);
        parsedDate = new Date(yyyy, mm, dd);
        dateFound = true;
        datePhraseToRemove = isoMatch[0];
      }
    }

    // Numeric dates: DD/MM/YYYY or MM/DD/YYYY or DD-MM (e.g. 25/08/2026, 25/08)
    if (!dateFound) {
      const numDateMatch = lower.match(/\b(\d{1,2})[-/](\d{1,2})(?:[-/](\d{2,4}))?\b/);
      if (numDateMatch) {
        let p1 = parseInt(numDateMatch[1], 10);
        let p2 = parseInt(numDateMatch[2], 10);
        let p3 = numDateMatch[3] ? parseInt(numDateMatch[3], 10) : today.getFullYear();
        if (p3 < 100) p3 += 2000;

        let dayNum = p1;
        let monthNum = p2 - 1;

        if (p1 <= 12 && p2 > 12) {
          monthNum = p1 - 1;
          dayNum = p2;
        }

        parsedDate = new Date(p3, monthNum, dayNum);
        dateFound = true;
        datePhraseToRemove = numDateMatch[0];
      }
    }

    // Named Month dates: "25th August", "Aug 25", "25 October 2026", "August 25th"
    if (!dateFound) {
      const monthNamesRegex = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:\s+(\d{4}))?\b/i;
      const monthNamesAltRegex = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?\b/i;

      const mMatch1 = lower.match(monthNamesRegex);
      const mMatch2 = lower.match(monthNamesAltRegex);
      const monthMap = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };

      if (mMatch1) {
        const dayNum = parseInt(mMatch1[1], 10);
        const mStr = mMatch1[2].toLowerCase().substring(0, 3);
        const yearNum = mMatch1[3] ? parseInt(mMatch1[3], 10) : today.getFullYear();
        if (monthMap[mStr] !== undefined) {
          parsedDate = new Date(yearNum, monthMap[mStr], dayNum);
          if (!mMatch1[3] && parsedDate < today) parsedDate.setFullYear(today.getFullYear() + 1);
          dateFound = true;
          datePhraseToRemove = mMatch1[0];
        }
      } else if (mMatch2) {
        const mStr = mMatch2[1].toLowerCase().substring(0, 3);
        const dayNum = parseInt(mMatch2[2], 10);
        const yearNum = mMatch2[3] ? parseInt(mMatch2[3], 10) : today.getFullYear();
        if (monthMap[mStr] !== undefined) {
          parsedDate = new Date(yearNum, monthMap[mStr], dayNum);
          if (!mMatch2[3] && parsedDate < today) parsedDate.setFullYear(today.getFullYear() + 1);
          dateFound = true;
          datePhraseToRemove = mMatch2[0];
        }
      }
    }

    // 4. Clean Title by removing date phrases, time phrases, and prepositions
    let cleanTitle = text;

    if (datePhraseToRemove) {
      cleanTitle = cleanTitle.replace(new RegExp('\\b' + escapeRegExp(datePhraseToRemove) + '\\b', 'gi'), '');
    }

    if (timeMatchedStr) {
      cleanTitle = cleanTitle.replace(new RegExp(escapeRegExp(timeMatchedStr), 'gi'), '');
    }

    // Strip prepositions left hanging: "at", "on", "due", "by", "for", "in"
    cleanTitle = cleanTitle
      .replace(/\b(at|on|due|by|for|in)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanTitle.length < 2) {
      cleanTitle = rawInput;
    }

    // Capitalize first letter
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

    const yyyy = parsedDate.getFullYear();
    const mm = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(parsedDate.getDate()).padStart(2, '0');
    const formattedDueDate = `${yyyy}-${mm}-${dd}`;

    return {
      title: cleanTitle,
      dueDate: formattedDueDate,
      dueTime: parsedTime,
      category: category,
      priority: priority
    };
  }
};

function getNextDayOfWeek(currentDate, dayOfWeek) {
  const resultDate = new Date(currentDate.getTime());
  const currentDay = currentDate.getDay();
  let distance = dayOfWeek - currentDay;
  if (distance <= 0) distance += 7;
  resultDate.setDate(currentDate.getDate() + distance);
  return resultDate;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
