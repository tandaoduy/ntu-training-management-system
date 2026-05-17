export const sanitizePositiveInteger = (value: string) => {
  const digits = value.replace(/\D/g, '').replace(/^0+/, '')

  return digits
}

export const clampPositiveInteger = (value: string, max?: number) => {
  const digits = sanitizePositiveInteger(value)

  if (!digits || max === undefined) {
    return digits
  }

  return String(Math.min(Number(digits), max))
}
