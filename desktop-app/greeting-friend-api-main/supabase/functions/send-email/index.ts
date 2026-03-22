// Edge Function: Sistema Email Unificato
// Gestisce inviti team + notifiche generali
// Email provider: Resend (noreply@rescuemanager.eu)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "re_VozQGsAi_EJDSHvY6pGjuQk6QHxBCmeLi";

interface EmailRequest {
  type: 'team_invite' | 'notification' | 'custom';
  to: string;
  subject?: string;
  data?: any;
}

serve(async (req) => {
  try {
    const payload: EmailRequest = await req.json();
    
    let emailData: any;

    switch (payload.type) {
      case 'team_invite':
        emailData = await buildTeamInviteEmail(payload.data);
        break;
      
      case 'notification':
        emailData = await buildNotificationEmail({ ...payload.data, email: payload.to });
        break;
      
      case 'custom':
        emailData = {
          to: [payload.to],
          subject: payload.subject || 'Notifica da RescueManager',
          html: payload.data.html,
          text: payload.data.text,
        };
        break;
      
      default:
        throw new Error(`Unknown email type: ${payload.type}`);
    }

    // Invia email tramite Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "RescueManager <noreply@rescuemanager.eu>",
        ...emailData,
      }),
    });

    if (!resendResponse.ok) {
      const error = await resendResponse.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const resendData = await resendResponse.json();

    console.log(`✅ Email ${payload.type} inviata a ${payload.to} (ID: ${resendData.id})`);

    return new Response(
      JSON.stringify({
        success: true,
        email_id: resendData.id,
        type: payload.type,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("❌ Errore invio email:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// Template email invito team
async function buildTeamInviteEmail(data: any) {
  const { email, org_name, role, inviter_name, accept_url, expires_date } = data;

  const roleLabels: Record<string, string> = {
    owner: "Proprietario",
    admin: "Amministratore",
    manager: "Responsabile",
    operator: "Operatore",
    viewer: "Visualizzatore",
  };

  const roleLabel = roleLabels[role] || role;

  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invito Team - ${org_name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                🎉 Sei stato invitato!
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Ciao,
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                <strong>${inviter_name}</strong> ti ha invitato a far parte del team di <strong>${org_name}</strong> su RescueManager.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px; margin: 30px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                      <strong style="color: #333333;">Organizzazione:</strong> ${org_name}
                    </p>
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                      <strong style="color: #333333;">Ruolo assegnato:</strong> ${roleLabel}
                    </p>
                    <p style="margin: 0; color: #666666; font-size: 14px;">
                      <strong style="color: #333333;">Invito valido fino al:</strong> ${expires_date}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.6;">
                Clicca sul pulsante qui sotto per accettare l'invito e creare il tuo account:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <a href="${accept_url}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      Accetta Invito
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #999999; font-size: 13px; line-height: 1.6;">
                Se il pulsante non funziona, copia e incolla questo link nel tuo browser:<br>
                <a href="${accept_url}" style="color: #667eea; word-break: break-all;">${accept_url}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8f9fa; padding: 30px 40px; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 13px; line-height: 1.6; text-align: center;">
                Questo invito è personale e non può essere trasferito ad altri.
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} RescueManager - Software Gestionale per Autodemolizioni
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Sei stato invitato a far parte del team di ${org_name}!

${inviter_name} ti ha invitato a unirti al team su RescueManager.

Dettagli invito:
- Organizzazione: ${org_name}
- Ruolo: ${roleLabel}
- Valido fino al: ${expires_date}

Accetta l'invito visitando questo link:
${accept_url}

Questo invito è personale e non può essere trasferito ad altri.

© ${new Date().getFullYear()} RescueManager
  `.trim();

  return {
    to: [email],
    subject: `Invito al team di ${org_name} su RescueManager`,
    html,
    text,
  };
}

// Template email notifica generica
async function buildNotificationEmail(data: any) {
  const { email, title, message, action_url, action_label, attachment_base64, attachment_name } = data;

  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">
                ${title}
              </h1>
              <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6; white-space: pre-line;">
                ${message}
              </p>
              
              ${action_url ? `
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <a href="${action_url}" style="display: inline-block; background: #667eea; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 15px; font-weight: 600;">
                      ${action_label || 'Visualizza'}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 40px; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #999999; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} RescueManager
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
${title}

${message}

${action_url ? `\n${action_label || 'Visualizza'}: ${action_url}` : ''}

© ${new Date().getFullYear()} RescueManager
  `.trim();

  const result: any = {
    to: [email],
    subject: title,
    html,
    text,
  };

  if (attachment_base64 && attachment_name) {
    result.attachments = [{
      filename: attachment_name,
      content: attachment_base64,
    }];
  }

  return result;
}
