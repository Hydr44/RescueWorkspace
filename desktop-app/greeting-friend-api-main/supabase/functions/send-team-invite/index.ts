// Edge Function: Invio email invito team
// Trigger: INSERT su org_invites
// Email provider: Resend (noreply@rescuemanager.eu)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "re_VozQGsAi_EJDSHvY6pGjuQk6QHxBCmeLi";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const APP_URL = Deno.env.get("APP_URL") || "https://rescuemanager.eu";

interface InvitePayload {
  type: "INSERT";
  table: "org_invites";
  record: {
    id: string;
    org_id: string;
    email: string;
    role: string;
    token: string;
    invited_by: string;
    expires_at: string;
  };
}

serve(async (req) => {
  try {
    const payload: InvitePayload = await req.json();
    const { record } = payload;

    // Inizializza Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Recupera info organizzazione
    const { data: org } = await supabase
      .from("orgs")
      .select("name")
      .eq("id", record.org_id)
      .single();

    // Recupera info invitante
    const { data: inviter } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", record.invited_by)
      .single();

    const orgName = org?.name || "RescueManager";
    const inviterName = inviter?.full_name || inviter?.email || "Un collega";
    const roleLabels: Record<string, string> = {
      owner: "Proprietario",
      admin: "Amministratore",
      manager: "Responsabile",
      operator: "Operatore",
      viewer: "Visualizzatore",
    };
    const roleLabel = roleLabels[record.role] || record.role;

    // Link di accettazione invito
    const acceptUrl = `${APP_URL}/accept-invite?token=${record.token}`;
    const expiresDate = new Date(record.expires_at).toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Template email HTML
    const htmlContent = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invito Team - ${orgName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                🎉 Sei stato invitato!
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Ciao,
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> ti ha invitato a far parte del team di <strong>${orgName}</strong> su RescueManager.
              </p>
              
              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px; margin: 30px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                      <strong style="color: #333333;">Organizzazione:</strong> ${orgName}
                    </p>
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                      <strong style="color: #333333;">Ruolo assegnato:</strong> ${roleLabel}
                    </p>
                    <p style="margin: 0; color: #666666; font-size: 14px;">
                      <strong style="color: #333333;">Invito valido fino al:</strong> ${expiresDate}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.6;">
                Clicca sul pulsante qui sotto per accettare l'invito e creare il tuo account:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <a href="${acceptUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      Accetta Invito
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #999999; font-size: 13px; line-height: 1.6;">
                Se il pulsante non funziona, copia e incolla questo link nel tuo browser:<br>
                <a href="${acceptUrl}" style="color: #667eea; word-break: break-all;">${acceptUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
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

    // Testo plain per client email senza HTML
    const textContent = `
Sei stato invitato a far parte del team di ${orgName}!

${inviterName} ti ha invitato a unirti al team su RescueManager.

Dettagli invito:
- Organizzazione: ${orgName}
- Ruolo: ${roleLabel}
- Valido fino al: ${expiresDate}

Accetta l'invito visitando questo link:
${acceptUrl}

Questo invito è personale e non può essere trasferito ad altri.

© ${new Date().getFullYear()} RescueManager
    `.trim();

    // Invia email tramite Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "RescueManager <noreply@rescuemanager.eu>",
        to: [record.email],
        subject: `Invito al team di ${orgName} su RescueManager`,
        html: htmlContent,
        text: textContent,
        reply_to: inviter?.email || "support@rescuemanager.eu",
      }),
    });

    if (!resendResponse.ok) {
      const error = await resendResponse.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const resendData = await resendResponse.json();

    // Log successo
    console.log(`✅ Email invito inviata a ${record.email} (Resend ID: ${resendData.id})`);

    return new Response(
      JSON.stringify({
        success: true,
        email_id: resendData.id,
        recipient: record.email,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
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
