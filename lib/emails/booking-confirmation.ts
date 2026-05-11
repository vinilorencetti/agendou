// Gera o HTML do e-mail de confirmação de agendamento

type Params = {
  businessName: string
  logoUrl?: string | null
  clientName: string
  serviceName: string
  professionalName: string
  date: string        // "seg, 12 de mai."
  time: string        // "09:00"
  price: string       // "R$ 50,00"
  cancellationPolicy: number // horas
  appointmentUrl?: string | null
}

export function bookingConfirmationHtml(p: Params): string {
  const brand = '#7C3AED'
  const cancel = p.cancellationPolicy > 0
    ? `<p style="margin:0 0 8px;color:#94a3b8;font-size:13px;">
        ⚠️ Cancelamento gratuito até <strong>${p.cancellationPolicy}h</strong> antes do horário marcado.
       </p>`
    : ''

  const logo = p.logoUrl
    ? `<img src="${p.logoUrl}" alt="${p.businessName}" width="56" height="56"
          style="border-radius:14px;object-fit:cover;margin-bottom:12px;" />`
    : `<div style="width:56px;height:56px;border-radius:14px;background:${brand};display:flex;align-items:center;justify-content:center;margin-bottom:12px;font-size:22px;font-weight:700;color:#fff;">
        ${p.businessName[0]}
       </div>`

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Agendamento confirmado — ${p.businessName}</title>
</head>
<body style="margin:0;padding:0;background:#0D0B12;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0B12;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#1a1726;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${brand} 0%,#5b21b6 100%);padding:32px 32px 28px;text-align:center;">
              ${logo}
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.7);">${p.businessName}</p>
              <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.3px;">
                Agendamento confirmado ✅
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 32px 8px;">
              <p style="margin:0 0 20px;color:#c4b5fd;font-size:15px;">
                Olá, <strong style="color:#fff;">${p.clientName}</strong>! Seu horário está reservado.
              </p>

              <!-- Detalhes -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 18px;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <p style="margin:0 0 2px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:.08em;">Serviço</p>
                    <p style="margin:0;color:#f3f0ff;font-size:15px;font-weight:600;">${p.serviceName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 18px;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <p style="margin:0 0 2px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:.08em;">Profissional</p>
                    <p style="margin:0;color:#f3f0ff;font-size:15px;font-weight:600;">${p.professionalName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 18px;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <p style="margin:0 0 2px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:.08em;">Data e horário</p>
                    <p style="margin:0;color:#f3f0ff;font-size:15px;font-weight:600;">${p.date} às ${p.time}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0 0 2px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:.08em;">Valor</p>
                    <p style="margin:0;color:${brand};font-size:18px;font-weight:700;">${p.price}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Policy + CTA -->
          <tr>
            <td style="padding:20px 32px 28px;">
              ${cancel}
              ${p.appointmentUrl ? `
              <a href="${p.appointmentUrl}"
                style="display:block;text-align:center;background:${brand};color:#fff;text-decoration:none;
                       font-size:14px;font-weight:700;padding:14px 24px;border-radius:12px;margin-top:8px;">
                Ver meus agendamentos →
              </a>` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0;color:#475569;font-size:12px;">
                Enviado por <strong style="color:#64748b;">${p.businessName}</strong> via Agendou
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function bookingConfirmationText(p: Params): string {
  return [
    `Agendamento confirmado — ${p.businessName}`,
    '',
    `Olá, ${p.clientName}!`,
    '',
    `Serviço: ${p.serviceName}`,
    `Profissional: ${p.professionalName}`,
    `Data e horário: ${p.date} às ${p.time}`,
    `Valor: ${p.price}`,
    '',
    p.cancellationPolicy > 0
      ? `Cancelamento gratuito até ${p.cancellationPolicy}h antes do horário marcado.`
      : '',
    '',
    p.appointmentUrl ? `Ver meus agendamentos: ${p.appointmentUrl}` : '',
  ].filter((l) => l !== undefined).join('\n')
}
