/**
 * Saudi Arabia Commercial Truck License Plate Utilities
 * Format: 1234 ABC (4 digits + 3 Latin letters)
 */

// Regex for Saudi commercial truck plates (e.g., "7653 TNJ")
const SAUDI_TRUCK_PLATE_REGEX = /^[0-9]{4}\s[A-Z]{3}$/;
const SAUDI_TRUCK_PLATE_LOOSE_REGEX = /^[0-9]{4}[A-Z]{3}$/;

/**
 * Validate Saudi commercial truck plate format
 * @param plate - License plate string
 * @returns true if valid format
 */
export function isValidSaudiTruckPlate(plate: string): boolean {
  if (!plate) return false;
  const cleaned = plate.trim().toUpperCase();
  return SAUDI_TRUCK_PLATE_REGEX.test(cleaned) || SAUDI_TRUCK_PLATE_LOOSE_REGEX.test(cleaned);
}

/**
 * Format Saudi truck plate to standard format: "1234 ABC"
 * @param plate - Raw plate input
 * @returns Formatted plate string
 */
export function formatSaudiTruckPlate(plate: string): string {
  if (!plate) return '';

  // Remove all whitespace and convert to uppercase
  const cleaned = plate.replace(/\s+/g, '').toUpperCase();

  // Extract digits and letters
  const digits = cleaned.match(/\d+/)?.[0] || '';
  const letters = cleaned.match(/[A-Z]+/)?.[0] || '';

  // Format: "1234 ABC"
  if (digits.length === 4 && letters.length === 3) {
    return `${digits} ${letters}`;
  }

  // Return partially formatted if incomplete
  if (digits || letters) {
    return `${digits}${letters ? ' ' + letters : ''}`.trim();
  }

  return cleaned;
}

/**
 * Auto-format as user types (for input fields)
 * @param value - Current input value
 * @returns Formatted value
 */
export function autoFormatPlateInput(value: string): string {
  // Remove all non-alphanumeric characters except space
  const cleaned = value.replace(/[^0-9A-Za-z\s]/g, '').toUpperCase();

  // Extract digits and letters
  const digits = cleaned.replace(/[^0-9]/g, '');
  const letters = cleaned.replace(/[^A-Z]/g, '');

  // Limit to 4 digits and 3 letters
  const limitedDigits = digits.slice(0, 4);
  const limitedLetters = letters.slice(0, 3);

  // Auto-add space after 4 digits
  if (limitedDigits.length === 4 && limitedLetters.length > 0) {
    return `${limitedDigits} ${limitedLetters}`;
  } else if (limitedDigits.length === 4) {
    return `${limitedDigits} `;
  } else if (limitedLetters.length > 0) {
    return `${limitedDigits} ${limitedLetters}`.trim();
  }

  return limitedDigits;
}
