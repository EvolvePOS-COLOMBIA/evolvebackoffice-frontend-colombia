/** Local Desktop protocol; opening the draft does not send it. */
export function whatsappPhone(value: string): string | null {
  if (/[^+\d\s().-]/.test(value)) return null
  let digits = value.replace(/\D/g, "")
  if (digits.startsWith("00")) digits = digits.slice(2)
  if (digits.length === 10 && digits.startsWith("3")) digits = `57${digits}`
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null
}
export function whatsappDesktopUrl(phone: string, message: string): string | null {
  const recipient = whatsappPhone(phone)
  return recipient ? `whatsapp://send?phone=${recipient}&text=${encodeURIComponent(message)}` : null
}
