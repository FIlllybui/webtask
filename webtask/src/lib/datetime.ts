import { format, parseISO } from "date-fns";

export function toDateTimeLocalValue(iso: string) {
  return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm");
}

export function fromDateTimeLocalValue(value: string) {
  // interpret local datetime string and convert to ISO
  const d = new Date(value);
  return d.toISOString();
}

