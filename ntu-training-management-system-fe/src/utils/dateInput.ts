export const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export const sanitizeDateInputValue = (value: string) => {
  const parts = value.split('-')

  if (parts.length !== 3) {
    return value
  }

  const [year, month, day] = parts
  return `${year.replace(/\D/g, '').slice(0, 4)}-${month}-${day}`
}

export const isFourDigitYearDate = (value: string) => DATE_INPUT_PATTERN.test(value)
