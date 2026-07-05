import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type PostDateInput = {
  date: Date | string
  time?: string
  timezone?: string
}

const DEFAULT_TIMEZONE = "UTC"

function getTimeZoneOffset(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  const parts = Object.fromEntries(
    formatter.formatToParts(date).map(({ type, value }) => [type, value])
  )
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second)
  )

  return asUtc - date.getTime()
}

export function getPostDateTime({ date, time, timezone = DEFAULT_TIMEZONE }: PostDateInput) {
  if (date instanceof Date && !time) return date

  const dateValue = date instanceof Date ? date.toISOString().slice(0, 10) : date
  const [year, month, day] = dateValue.split("-").map(Number)
  const [hour = 0, minute = 0, second = 0] = (time ?? "00:00")
    .split(":")
    .map(Number)

  if (timezone === DEFAULT_TIMEZONE) {
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second))
  }

  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second))
  const firstOffset = getTimeZoneOffset(utcGuess, timezone)
  const firstUtc = new Date(utcGuess.getTime() - firstOffset)
  const secondOffset = getTimeZoneOffset(firstUtc, timezone)

  return new Date(utcGuess.getTime() - secondOffset)
}

export function formatDate(date: Date | string) {
  const value = typeof date === "string" ? getPostDateTime({ date }) : date

  return Intl.DateTimeFormat("en-US", {
    timeZone: DEFAULT_TIMEZONE,
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(value)
}

export function formatPostDateTime(input: PostDateInput) {
  const value = getPostDateTime(input)
  const hasTime = Boolean(input.time)

  return Intl.DateTimeFormat("en-US", {
    timeZone: input.timezone ?? DEFAULT_TIMEZONE,
    month: "short",
    day: "2-digit",
    year: "numeric",
    ...(hasTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
          timeZoneName: "short",
        }
      : {}),
  }).format(value)
}

export function readingTime(html: string) {
  const textOnly = html.replace(/<[^>]+>/g, "")
  const wordCount = textOnly.split(/\s+/).length
  const readingTimeMinutes = ((wordCount / 200) + 1).toFixed()
  return `${readingTimeMinutes} min read`
}
