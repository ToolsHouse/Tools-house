/**
 * Formatting utilities for the Tools House application
 */

/**
 * Format a number as Egyptian Pounds (EGP)
 * @param {number} value - The value to format
 * @returns {string} Formatted currency string (e.g., "250.00 ج.م")
 */
export const formatCurrency = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return '0.00 ج.م'
  return value.toFixed(2) + ' ج.م'
}

/**
 * Format a number as a count/quantity (no currency symbol)
 * @param {number} value - The value to format
 * @returns {string} Formatted count string (e.g., "1,234")
 */
export const formatCount = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return '0'
  return value.toLocaleString('ar-EG')
}

/**
 * Format a number with optional currency symbol
 * @param {number} value - The value to format
 * @param {boolean} isCurrency - Whether to add currency symbol
 * @returns {string} Formatted string
 */
export const formatNumber = (value, isCurrency = true) => {
  if (typeof value !== 'number' || isNaN(value)) return isCurrency ? '0.00 ج.م' : '0'
  return isCurrency ? value.toFixed(2) + ' ج.م' : value.toLocaleString('ar-EG')
}
