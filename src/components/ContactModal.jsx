import { useEffect, useRef, useState } from 'react'
import { STORE_CONTACT } from '../data/storeContact.js'
import { copyText } from '../lib/clipboard.js'
import { showToast, TOAST_KINDS } from '../lib/toast.js'
import { isValidEmail } from '../lib/validators.js'
import { sendContactMessage } from '../services/contactService.js'
import ModalShell from './ModalShell.jsx'
import { Check, Copy, Mail, Send, Shield } from './icons.jsx'

const EMPTY_FORM = { name: '', email: '', subject: '', message: '' }

const inputClass =
  'toy-input w-full rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 placeholder:font-normal placeholder:text-slate-400'

function Field({ id, label, error, children }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[10px] font-black uppercase tracking-wide text-slate-500"
      >
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-[11px] font-bold text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Modal "Contáctanos" del footer.
 *
 * Valida nombre, correo, asunto y mensaje; registra la consulta con una
 * referencia y muestra una confirmación dentro del mismo modal. Incluye un
 * botón para copiar el correo de la tienda sin salir de la web.
 */
export default function ContactModal({ onClose }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')
  const [feedback, setFeedback] = useState('')
  const [sent, setSent] = useState(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) =>
      current[name] ? { ...current, [name]: '' } : current,
    )

    if (feedback) setFeedback('')
  }

  async function handleCopyEmail() {
    const copied = await copyText(STORE_CONTACT.email)

    showToast(
      copied
        ? {
            kind: TOAST_KINDS.SUCCESS,
            title: 'Correo copiado',
            message: `${STORE_CONTACT.email} está en tu portapapeles.`,
          }
        : {
            kind: TOAST_KINDS.ERROR,
            title: 'No pudimos copiar',
            message: 'Selecciona el correo y cópialo manualmente.',
          },
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (status === 'sending') return

    const nextErrors = {}

    if (form.name.trim().length < 2) {
      nextErrors.name = 'Escribe tu nombre (mínimo 2 letras).'
    }

    if (!isValidEmail(form.email.trim())) {
      nextErrors.email = 'Ingresa un correo válido, por ejemplo nombre@correo.com.'
    }

    if (form.subject.trim().length < 3) {
      nextErrors.subject = 'Resume el motivo de tu consulta.'
    }

    if (form.message.trim().length < 10) {
      nextErrors.message = 'Cuéntanos un poco más (mínimo 10 caracteres).'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setFeedback('Revisa los campos marcados para poder enviar tu mensaje.')
      return
    }

    setStatus('sending')
    setFeedback('')

    try {
      const result = await sendContactMessage(form)

      if (!mountedRef.current) return

      setSent(result)
      setStatus('success')
      showToast({
        kind: TOAST_KINDS.SUCCESS,
        title: '¡Mensaje enviado!',
        message: `Guardamos tu consulta ${result.reference}. Te responderemos pronto.`,
      })
    } catch (error) {
      if (!mountedRef.current) return

      setStatus('idle')
      setFeedback(
        error instanceof Error
          ? error.message
          : 'No pudimos enviar tu mensaje. Inténtalo de nuevo.',
      )
    }
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setErrors({})
    setFeedback('')
    setSent(null)
    setStatus('idle')
  }

  return (
    <ModalShell
      onClose={onClose}
      labelledBy="contacto-titulo"
      describedBy="contacto-descripcion"
      closeLabel="Cerrar formulario de contacto"
      maxWidth="max-w-xl"
    >
      <div className="pr-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-200 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-red-900">
          <Mail className="h-3.5 w-3.5" /> Contáctanos
        </span>
        <h2
          id="contacto-titulo"
          className="mt-3 font-festive text-3xl font-bold leading-none tracking-wide text-red-800"
        >
          Hablemos de tu regalo
        </h2>
        <p
          id="contacto-descripcion"
          className="mt-2 text-sm font-semibold leading-relaxed text-slate-600"
        >
          Cuéntanos qué necesitas y te responderemos en horario de atención.
          También puedes escribirnos por{' '}
          <a
            href={STORE_CONTACT.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-extrabold text-emerald-700 underline-offset-2 transition hover:text-emerald-600 hover:underline"
          >
            WhatsApp
          </a>
          .
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-2xl border-2 border-amber-200 bg-amber-50 px-3 py-2">
        <Mail className="h-4 w-4 shrink-0 text-red-700" />
        <span className="min-w-0 flex-1 truncate text-xs font-extrabold text-slate-700">
          {STORE_CONTACT.email}
        </span>
        <button
          type="button"
          onClick={handleCopyEmail}
          className="inline-flex min-h-8 shrink-0 cursor-pointer items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-black text-red-700 ring-1 ring-amber-200 transition hover:-translate-y-0.5 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          <Copy className="h-3.5 w-3.5" /> Copiar
        </button>
      </div>

      {status === 'success' && sent ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-5 animate-bounce-in rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-5 text-center"
        >
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white text-emerald-600 shadow-md ring-4 ring-white">
            <Check className="h-8 w-8" />
          </span>
          <p className="mt-3 font-display text-xl font-extrabold text-emerald-800">
            ¡Mensaje enviado!
          </p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-emerald-700">
            Gracias, {form.name.trim()}. Te responderemos a{' '}
            <span className="break-all">{form.email.trim()}</span> lo antes
            posible.
          </p>
          <p className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
            Referencia {sent.reference}
          </p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border-2 border-emerald-300 bg-white px-4 py-2 text-sm font-extrabold text-emerald-800 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
            >
              Escribir otro mensaje
            </button>
            <button
              type="button"
              onClick={onClose}
              className="christmas-btn inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl px-4 py-2 text-sm font-extrabold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60"
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          aria-busy={status === 'sending'}
          className="mt-5 space-y-3.5"
        >
          {feedback && (
            <div
              role="alert"
              className="animate-shake rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 ring-1 ring-rose-200"
            >
              {feedback}
            </div>
          )}

          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field id="contacto-nombre" label="Nombre" error={errors.name}>
              <input
                id="contacto-nombre"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Tu nombre"
                autoComplete="name"
                maxLength={80}
                data-autofocus
                aria-invalid={Boolean(errors.name)}
                aria-describedby={
                  errors.name ? 'contacto-nombre-error' : undefined
                }
                className={inputClass}
              />
            </Field>

            <Field id="contacto-correo" label="Correo" error={errors.email}>
              <input
                id="contacto-correo"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="nombre@correo.com"
                autoComplete="email"
                inputMode="email"
                maxLength={120}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={
                  errors.email ? 'contacto-correo-error' : undefined
                }
                className={inputClass}
              />
            </Field>
          </div>

          <Field id="contacto-asunto" label="Asunto" error={errors.subject}>
            <input
              id="contacto-asunto"
              name="subject"
              type="text"
              value={form.subject}
              onChange={handleChange}
              placeholder="Ej. Consulta por un regalo de Navidad"
              maxLength={120}
              aria-invalid={Boolean(errors.subject)}
              aria-describedby={
                errors.subject ? 'contacto-asunto-error' : undefined
              }
              className={inputClass}
            />
          </Field>

          <Field id="contacto-mensaje" label="Mensaje" error={errors.message}>
            <textarea
              id="contacto-mensaje"
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Cuéntanos la edad del niño, el juguete que buscas o cualquier detalle que nos ayude."
              rows={4}
              maxLength={1200}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={
                errors.message ? 'contacto-mensaje-error' : undefined
              }
              className={`${inputClass} resize-y`}
            />
          </Field>

          <button
            type="submit"
            disabled={status === 'sending'}
            className="christmas-btn inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60 disabled:cursor-wait disabled:opacity-70"
          >
            {status === 'sending' ? (
              'Enviando…'
            ) : (
              <>
                <Send className="h-4 w-4" /> Enviar mensaje
              </>
            )}
          </button>

          <p className="flex items-start gap-1.5 text-[10px] font-semibold leading-relaxed text-slate-400">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Usaremos tus datos solo para responder tu consulta. No compartimos
            tu correo con terceros.
          </p>
        </form>
      )}
    </ModalShell>
  )
}
