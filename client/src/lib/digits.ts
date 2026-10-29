// Arabic-Indic digits -> Latin digits (phone numbers and amounts typed on Arabic keyboards).
const AR = "٠١٢٣٤٥٦٧٨٩";
export const toLatinDigits = (input = "") => input.replace(/[٠-٩]/g, (d) => String(AR.indexOf(d)));
