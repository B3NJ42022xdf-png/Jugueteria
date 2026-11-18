/**
 * Iconos SVG compartidos (estilo Lucide/Heroicons).
 *
 * Todos usan `currentColor`, trazo redondeado y `aria-hidden`, de modo que el
 * texto que los acompaña sigue siendo la fuente accesible del significado.
 * Se centralizan aquí para no repetir paths ni agregar una dependencia extra.
 */

export function Icon({ children, className = 'h-5 w-5', ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

export function ChristmasTree(props) {
  return (
    <Icon {...props}>
      <path d="M12 3 6.5 10.5H9L5 16h5v2h4v-2h5l-4-5.5h2.5L12 3Z" />
      <path d="M12 18v3" />
    </Icon>
  )
}

export function Gift(props) {
  return (
    <Icon {...props}>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
    </Icon>
  )
}

export function Snowflake(props) {
  return (
    <Icon {...props}>
      <path d="M12 2v20" />
      <path d="M2 12h20" />
      <path d="m4.9 4.9 14.2 14.2" />
      <path d="M19.1 4.9 4.9 19.1" />
      <path d="m9 4 3 2 3-2" />
      <path d="m9 20 3-2 3 2" />
      <path d="m4 9 2 3-2 3" />
      <path d="m20 9-2 3 2 3" />
    </Icon>
  )
}

export function Sparkles(props) {
  return (
    <Icon {...props}>
      <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
      <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
    </Icon>
  )
}

export function Star(props) {
  return (
    <Icon {...props}>
      <path d="m12 3 2.7 5.8 6.3.8-4.6 4.4 1.2 6.2L12 17.4 6.4 20.2l1.2-6.2L3 9.6l6.3-.8L12 3Z" />
    </Icon>
  )
}

export function Truck(props) {
  return (
    <Icon {...props}>
      <path d="M3 6h11v10H3z" />
      <path d="M14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </Icon>
  )
}

export function Package(props) {
  return (
    <Icon {...props}>
      <path d="m21 8-9-5-9 5 9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </Icon>
  )
}

export function Search(props) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Icon>
  )
}

export function Shield(props) {
  return (
    <Icon {...props}>
      <path d="M12 3 5 6v5c0 4.4 3 8.3 7 10 4-1.7 7-5.6 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  )
}

export function Bolt(props) {
  return (
    <Icon {...props}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </Icon>
  )
}

export function Scale(props) {
  return (
    <Icon {...props}>
      <path d="M12 3v18" />
      <path d="M7 21h10" />
      <path d="M5 7h14" />
      <path d="m5 7-2 5a3 3 0 0 0 6 0L7 7" />
      <path d="m19 7-2 5a3 3 0 0 0 6 0l-2-5" />
    </Icon>
  )
}

export function Wrench(props) {
  return (
    <Icon {...props}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />
    </Icon>
  )
}

export function Recycle(props) {
  return (
    <Icon {...props}>
      <path d="M7 19H4.8a2 2 0 0 1-1.7-3l2.2-3.8" />
      <path d="m9.5 5.5 1.2-2a2 2 0 0 1 3.4 0l2 3.4" />
      <path d="M14 19h5.2a2 2 0 0 0 1.7-3l-1.2-2" />
      <path d="m7.3 9.7-1.8 3.1" />
      <path d="m16.7 14.3 1.8-3.1" />
      <path d="m9 19 2 2 2-2" />
    </Icon>
  )
}

export function Receipt(props) {
  return (
    <Icon {...props}>
      <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3Z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
    </Icon>
  )
}

export function Building(props) {
  return (
    <Icon {...props}>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M8 7h2" />
      <path d="M14 7h2" />
      <path d="M8 11h2" />
      <path d="M14 11h2" />
      <path d="M8 15h2" />
      <path d="M14 15h2" />
      <path d="M10 21v-3h4v3" />
    </Icon>
  )
}

export function TeddyBear(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="13" r="6" />
      <circle cx="6" cy="7" r="2.2" />
      <circle cx="18" cy="7" r="2.2" />
      <path d="M10 12h.01" />
      <path d="M14 12h.01" />
      <path d="M10.5 15a2 2 0 0 0 3 0" />
    </Icon>
  )
}

export function Puzzle(props) {
  return (
    <Icon {...props}>
      <path d="M10 4a2 2 0 0 1 4 0v1h3a2 2 0 0 1 2 2v3h1a2 2 0 1 1 0 4h-1v3a2 2 0 0 1-2 2h-3v-1a2 2 0 1 0-4 0v1H7a2 2 0 0 1-2-2v-3H4a2 2 0 1 1 0-4h1V7a2 2 0 0 1 2-2h3V4Z" />
    </Icon>
  )
}

export function AlertTriangle(props) {
  return (
    <Icon {...props}>
      <path d="M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Icon>
  )
}

export function Check(props) {
  return (
    <Icon {...props}>
      <path d="m5 12 4 4L19 6" />
    </Icon>
  )
}

export function Activity(props) {
  return (
    <Icon {...props}>
      <path d="M3 12h4l3 8 4-16 3 8h4" />
    </Icon>
  )
}

export function Mail(props) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </Icon>
  )
}

export function PartyPopper(props) {
  return (
    <Icon {...props}>
      <path d="M5.8 11.3 3 21l9.7-2.8" />
      <path d="M9 9c1.5 1.5 2 3.5 1 6" />
      <path d="M13 5c1.5 1.5 2 3.5 1 6" />
      <path d="M17 1c1.5 1.5 2 3.5 1 6" />
      <path d="M14 13l.01.01" />
      <path d="M18 9l.01.01" />
      <path d="M21 13l.01.01" />
    </Icon>
  )
}

export function GiftTag(props) {
  return (
    <Icon {...props}>
      <path d="M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
      <path d="M7.5 7.5h.01" />
    </Icon>
  )
}

export function Heart(props) {
  return (
    <Icon {...props}>
      <path d="M20.8 5.6a5.1 5.1 0 0 0-7.2 0L12 7.2l-1.6-1.6a5.1 5.1 0 0 0-7.2 7.2L12 21l8.8-8.2a5.1 5.1 0 0 0 0-7.2Z" />
    </Icon>
  )
}

export function HeartFilled(props) {
  return (
    <Icon {...props} fill="currentColor" strokeWidth="1.2">
      <path d="M20.8 5.6a5.1 5.1 0 0 0-7.2 0L12 7.2l-1.6-1.6a5.1 5.1 0 0 0-7.2 7.2L12 21l8.8-8.2a5.1 5.1 0 0 0 0-7.2Z" />
    </Icon>
  )
}

export function SnowflakeOff(props) {
  return (
    <Icon {...props}>
      <path d="m2 2 20 20" />
      <path d="M12 4v4" />
      <path d="M12 16v4" />
      <path d="M4.9 6.9 7.7 9.7" />
      <path d="m16.3 14.3 2.8 2.8" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <path d="m7.7 14.3-2.8 2.8" />
      <path d="m16.3 9.7 2.8-2.8" />
    </Icon>
  )
}

export function Ticket(props) {
  return (
    <Icon {...props}>
      <path d="M3 9a3 3 0 0 0 0 6v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3a3 3 0 0 1 0-6V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v3Z" />
      <path d="M13 5v2" />
      <path d="M13 11v2" />
      <path d="M13 17v2" />
    </Icon>
  )
}

export function X(props) {
  return (
    <Icon {...props}>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </Icon>
  )
}

export function Clock(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icon>
  )
}

export function CreditCard(props) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 10h19" />
      <path d="M6 15h4" />
    </Icon>
  )
}

export function Phone(props) {
  return (
    <Icon {...props}>
      <path d="M6.5 3h3l1.5 4-2 1.5a13 13 0 0 0 6.5 6.5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17.5 17.5 0 0 1 4.5 5.2 2 2 0 0 1 6.5 3Z" />
    </Icon>
  )
}

export function MapPin(props) {
  return (
    <Icon {...props}>
      <path d="M20 10c0 5.5-8 11-8 11S4 15.5 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </Icon>
  )
}

export function Copy(props) {
  return (
    <Icon {...props}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </Icon>
  )
}

export function Send(props) {
  return (
    <Icon {...props}>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </Icon>
  )
}

export function ExternalLink(props) {
  return (
    <Icon {...props}>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
    </Icon>
  )
}

export function Store(props) {
  return (
    <Icon {...props}>
      <path d="M4 10v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9" />
      <path d="M3 10 5 4h14l2 6" />
      <path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
      <path d="M9 20v-5h6v5" />
    </Icon>
  )
}

export function GraduationCap(props) {
  return (
    <Icon {...props}>
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
      <path d="M22 10v6" />
    </Icon>
  )
}

export function WhatsApp(props) {
  return (
    <Icon {...props} fill="currentColor" strokeWidth="0">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </Icon>
  )
}
