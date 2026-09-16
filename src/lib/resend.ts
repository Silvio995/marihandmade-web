import type * as React from 'react'
import { Resend } from 'resend'
import { getOptionalEnv, isProductionEnvironment } from '@/lib/env'

export type EmailSendMode = 'log' | 'resend'

type SendEmailArgs = {
  tag: string
  to: string | string[]
  subject: string
  text?: string
  html?: string
  react?: React.ReactNode
  from?: string
  throwOnFailure?: boolean
}

type SendEmailResult = {
  ok: boolean
  mode: EmailSendMode
}

let resendClient: Resend | null = null

function isBlank(value: string | undefined | null) {
  return !value || value.trim().length === 0
}

function isExampleDomainEmail(value: string) {
  return /@(?:.+\.)?example\.com>?$/i.test(value.trim())
}

function maskEmail(value: string) {
  const trimmed = value.trim()
  const match = trimmed.match(/^(.*<)?([^<>\s]+@[^<>\s]+)(>)?$/)
  const email = match?.[2] ?? trimmed
  const [localPart = '', domain = ''] = email.split('@')

  if (!domain) {
    return '[invalid-email]'
  }

  const visibleLocal = localPart.slice(0, 2)
  return `${visibleLocal || '*'}***@${domain}`
}

function formatRecipients(to: string | string[]) {
  const recipients = Array.isArray(to) ? to : [to]
  return recipients.map(maskEmail).join(',')
}

function resolveConfiguredMode(): EmailSendMode {
  const explicitMode = getOptionalEnv('EMAIL_SEND_MODE')?.toLowerCase()
  if (explicitMode === 'log' || explicitMode === 'resend') {
    return explicitMode
  }

  return isProductionEnvironment ? 'resend' : 'log'
}

export function getDefaultFrom() {
  return (
    getOptionalEnv('EMAIL_FROM') ||
    getOptionalEnv('RESEND_FROM_EMAIL') ||
    (isProductionEnvironment ? '' : 'Mari Atelier <no-reply@localhost.test>')
  )
}

function getResend() {
  if (!resendClient) {
    resendClient = new Resend(getOptionalEnv('RESEND_API_KEY'))
  }

  return resendClient
}

function buildEmailError(message: string) {
  return new Error(`[EMAIL:ERROR] ${message}`)
}

function handleEmailFailure(
  tag: string,
  to: string | string[],
  message: string,
  throwOnFailure: boolean
) {
  const error = buildEmailError(`${tag} to=${formatRecipients(to)} ${message}`)
  console.error(error.message)

  if (throwOnFailure || isProductionEnvironment) {
    throw error
  }
}

export async function sendEmail({
  tag,
  to,
  subject,
  text,
  html,
  react,
  from,
  throwOnFailure = false,
}: SendEmailArgs): Promise<SendEmailResult> {
  const mode = resolveConfiguredMode()
  const resolvedFrom = from?.trim() || getDefaultFrom()

  if (mode === 'log') {
    console.info(
      `[EMAIL:LOG] ${tag} to=${formatRecipients(to)} subject=${JSON.stringify(subject)} from=${JSON.stringify(resolvedFrom)}`
    )
    return { ok: true, mode }
  }

  if (isBlank(getOptionalEnv('RESEND_API_KEY'))) {
    handleEmailFailure(tag, to, 'RESEND_API_KEY is not configured', throwOnFailure)
    return { ok: false, mode }
  }

  if (isBlank(resolvedFrom)) {
    handleEmailFailure(tag, to, 'EMAIL_FROM is not configured', throwOnFailure)
    return { ok: false, mode }
  }

  if (isExampleDomainEmail(resolvedFrom)) {
    handleEmailFailure(
      tag,
      to,
      `sender ${JSON.stringify(resolvedFrom)} uses example.com and cannot be used for delivery`,
      throwOnFailure
    )
    return { ok: false, mode }
  }

  try {
    const response = await getResend().emails.send({
      from: resolvedFrom,
      to,
      subject,
      text,
      html,
      react,
    })

    if (response && typeof response === 'object' && 'error' in response && response.error) {
      const err = response.error as { message?: string }
      handleEmailFailure(
        tag,
        to,
        `Resend rejected the message: ${err?.message ?? 'unknown error'}`,
        throwOnFailure
      )
      return { ok: false, mode }
    }

    return { ok: true, mode }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error'
    handleEmailFailure(tag, to, `delivery failed: ${message}`, throwOnFailure)
    return { ok: false, mode }
  }
}
