export function autotyping(str: string) {
  // Check for boolean values first
  if (str.toLowerCase() === "true") {
    return true;
  } else if (str.toLowerCase() === "false") {
    return false;
  }

  // Check for number values
  const num = Number(str);
  if (!isNaN(num) && str.trim() !== "") {
    return num;
  }

  // Return the original string if it's not a boolean or number
  return str;
}
