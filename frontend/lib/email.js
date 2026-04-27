import nodemailer from "nodemailer"
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2"
import { createDeliveryAccessToken } from "@/lib/access"
import { TURNAROUND_LABELS } from "@/lib/order-config"
import { getBaseUrl } from "@/lib/site"

let sesClient
let smtpTransporter

function getNotificationRecipient() {
  return process.env.RUNTIME_RESUME_NOTIFICATION_EMAIL || "lance@runtimerec.com"
}

function getFromEmail() {
  return process.env.SES_FROM_EMAIL || ""
}

function getReplyToEmail() {
  return process.env.SES_REPLY_TO || ""
}

function hasAwsSesConfig() {
  return Boolean((process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION) && getFromEmail())
}

function hasSmtpConfig() {
  return Boolean(
    process.env.SES_SMTP_HOST &&
    process.env.SES_SMTP_PORT &&
    process.env.SES_USERNAME &&
    process.env.SES_PASSWORD &&
    getFromEmail()
  )
}

function getSesClient() {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION
  if (!region) {
    throw new Error("AWS_REGION is not configured")
  }

  if (!sesClient) {
    sesClient = new SESv2Client({ region })
  }

  return sesClient
}

function getSmtpTransporter() {
  if (!hasSmtpConfig()) {
    throw new Error("SES SMTP settings are not configured")
  }

  if (!smtpTransporter) {
    const port = Number(process.env.SES_SMTP_PORT || 587)
    smtpTransporter = nodemailer.createTransport({
      host: process.env.SES_SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SES_USERNAME,
        pass: process.env.SES_PASSWORD
      }
    })
  }

  return smtpTransporter
}

export function canSendEmail() {
  return hasSmtpConfig() || hasAwsSesConfig()
}

async function sendSimpleEmail({ to, subject, text, html }) {
  const from = getFromEmail()
  if (!from) {
    throw new Error("SES_FROM_EMAIL is not configured")
  }

  const replyTo = getReplyToEmail()

  if (hasSmtpConfig()) {
    const transporter = getSmtpTransporter()
    await transporter.sendMail({
      from,
      to,
      replyTo: replyTo || undefined,
      subject,
      text,
      html
    })
    return
  }

  const client = getSesClient()
  await client.send(
    new SendEmailCommand({
      FromEmailAddress: from,
      Destination: {
        ToAddresses: [to]
      },
      ReplyToAddresses: replyTo ? [replyTo] : undefined,
      Content: {
        Simple: {
          Subject: {
            Data: subject
          },
          Body: {
            Text: {
              Data: text
            },
            Html: {
              Data: html
            }
          }
        }
      }
    })
  )
}

export async function sendOrderConfirmationEmail(order) {
  const to = order.customer_email
  if (!to) {
    throw new Error("customer_email missing for confirmation email")
  }

  const turnaround = TURNAROUND_LABELS[order.tier] || "the turnaround for your selected tier"
  const baseUrl = getBaseUrl()
  const orderUrl = `${baseUrl}/order/success?session_id=${encodeURIComponent(order.session_id)}`
  const intakeUrl = `${baseUrl}/intake?session_id=${encodeURIComponent(order.session_id)}`

  const subject = `RunTime Resume booking confirmed${order.tier_name ? ` — ${order.tier_name}` : ""}`
  const text = [
    "Your order is confirmed.",
    "",
    order.tier_name ? `Tier: ${order.tier_name}` : "",
    turnaround ? `Expected turnaround: ${turnaround}` : "",
    "",
    `Complete your intake here: ${intakeUrl}`,
    `Order details: ${orderUrl}`,
    "",
    "RunTime Resume is operated by RunTime Recruitment."
  ]
    .filter(Boolean)
    .join("\n")

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f1f1f;">
      <h2 style="margin-bottom:12px;">Your RunTime Resume order is confirmed.</h2>
      <p>Thank you for booking.</p>
      <p><strong>Tier:</strong> ${order.tier_name || order.tier}</p>
      <p><strong>Expected turnaround:</strong> ${turnaround}</p>
      <p><a href="${intakeUrl}" style="display:inline-block;background:#c0392b;color:#fff;text-decoration:none;padding:12px 18px;">Open intake form</a></p>
      <p><a href="${orderUrl}">View your order details</a></p>
      <p>RunTime Resume is operated by RunTime Recruitment.</p>
    </div>
  `

  await sendSimpleEmail({ to, subject, text, html })
}

export async function sendIntakeReminderEmail(order) {
  const to = order.customer_email
  if (!to) {
    throw new Error("customer_email missing for intake reminder email")
  }

  const baseUrl = getBaseUrl()
  const intakeUrl = `${baseUrl}/intake?session_id=${encodeURIComponent(order.session_id)}`
  const subject = "Reminder: complete your RunTime Resume intake"
  const text = [
    "You have completed payment, but your intake form has not been submitted yet.",
    "",
    `Complete your intake here: ${intakeUrl}`,
    "",
    "RunTime Resume is operated by RunTime Recruitment."
  ].join("\n")

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f1f1f;">
      <h2 style="margin-bottom:12px;">Reminder: complete your intake</h2>
      <p>Your order is paid, but the review cannot start until the intake is submitted.</p>
      <p><a href="${intakeUrl}" style="display:inline-block;background:#c0392b;color:#fff;text-decoration:none;padding:12px 18px;">Complete intake</a></p>
      <p>RunTime Resume is operated by RunTime Recruitment.</p>
    </div>
  `

  await sendSimpleEmail({ to, subject, text, html })
}

export async function sendReportDeliveryEmail(order, artifact) {
  const to = order.customer_email
  if (!to) {
    throw new Error("customer_email missing for delivery email")
  }

  if (!artifact) {
    throw new Error("artifact missing for delivery email")
  }

  const baseUrl = getBaseUrl()
  const accessToken = createDeliveryAccessToken(order.session_id)
  const deliveryUrl = `${baseUrl}/delivery/${encodeURIComponent(order.session_id)}?access=${encodeURIComponent(accessToken)}`
  const subject = "Your RunTime Resume Signal Check is ready"
  const text = [
    "Your reviewed Signal Check report is ready.",
    "",
    `Open your delivery page: ${deliveryUrl}`,
    "",
    "RunTime Resume is operated by RunTime Recruitment."
  ].join("\n")

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f1f1f;">
      <h2 style="margin-bottom:12px;">Your reviewed Signal Check report is ready.</h2>
      <p>Your delivery page contains the reviewed report and the PDF download link.</p>
      <p><a href="${deliveryUrl}" style="display:inline-block;background:#c0392b;color:#fff;text-decoration:none;padding:12px 18px;">Open delivery page</a></p>
      <p>RunTime Resume is operated by RunTime Recruitment.</p>
    </div>
  `

  await sendSimpleEmail({ to, subject, text, html })
}

export async function sendInternalPurchaseNotification(order) {
  const to = getNotificationRecipient()
  const baseUrl = getBaseUrl()
  const adminUrl = `${baseUrl}/admin/reviewer-queue/${encodeURIComponent(order.session_id)}`
  const amount = order.amount_total != null ? `${(order.amount_total / 100).toFixed(2)} ${(order.currency || "AUD").toUpperCase()}` : "—"
  const subject = `New RunTime Resume order${order.tier_name ? ` — ${order.tier_name}` : ""}`
  const text = [
    "A new RunTime Resume order has been paid.",
    "",
    `Tier: ${order.tier_name || order.tier || "—"}`,
    `Session: ${order.session_id}`,
    `Customer: ${order.customer_name || "—"}`,
    `Email: ${order.customer_email || "—"}`,
    `Amount: ${amount}`,
    `Add-ons: ${order.addons?.length ? order.addons.join(", ") : "—"}`,
    "",
    `Open in admin: ${adminUrl}`
  ].join("\n")

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f1f1f;">
      <h2 style="margin-bottom:12px;">New RunTime Resume order paid</h2>
      <p><strong>Tier:</strong> ${order.tier_name || order.tier || "—"}</p>
      <p><strong>Session:</strong> ${order.session_id}</p>
      <p><strong>Customer:</strong> ${order.customer_name || "—"}</p>
      <p><strong>Email:</strong> ${order.customer_email || "—"}</p>
      <p><strong>Amount:</strong> ${amount}</p>
      <p><strong>Add-ons:</strong> ${order.addons?.length ? order.addons.join(", ") : "—"}</p>
      <p><a href="${adminUrl}" style="display:inline-block;background:#c0392b;color:#fff;text-decoration:none;padding:12px 18px;">Open in admin</a></p>
    </div>
  `

  await sendSimpleEmail({ to, subject, text, html })
}

export async function sendContactInquiryNotification(inquiry) {
  const to = getNotificationRecipient()
  const baseUrl = getBaseUrl()
  const adminUrl = `${baseUrl}/admin/orders`
  const subject = `New RunTime Resume contact enquiry — ${inquiry.name || inquiry.email || "Unknown"}`
  const text = [
    "A new contact enquiry has been submitted.",
    "",
    `Name: ${inquiry.name || "—"}`,
    `Email: ${inquiry.email || "—"}`,
    `LinkedIn: ${inquiry.linkedin_url || "—"}`,
    `Target role: ${inquiry.target_role || "—"}`,
    `Geography: ${inquiry.geography || "—"}`,
    "",
    inquiry.fit_question || "—",
    "",
    `Open admin: ${adminUrl}`
  ].join("\n")

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f1f1f;">
      <h2 style="margin-bottom:12px;">New contact enquiry</h2>
      <p><strong>Name:</strong> ${inquiry.name || "—"}</p>
      <p><strong>Email:</strong> ${inquiry.email || "—"}</p>
      <p><strong>LinkedIn:</strong> ${inquiry.linkedin_url || "—"}</p>
      <p><strong>Target role:</strong> ${inquiry.target_role || "—"}</p>
      <p><strong>Geography:</strong> ${inquiry.geography || "—"}</p>
      <p><strong>Question:</strong><br />${(inquiry.fit_question || "—").split("\n").join("<br />")}</p>
      <p><a href="${adminUrl}" style="display:inline-block;background:#c0392b;color:#fff;text-decoration:none;padding:12px 18px;">Open admin</a></p>
    </div>
  `

  await sendSimpleEmail({ to, subject, text, html })
}
