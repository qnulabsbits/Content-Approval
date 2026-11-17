// Supabase Edge Function: zoho-crm
// Handles all Zoho CRM operations

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ZOHO_CLIENT_ID     = Deno.env.get("ZOHO_CLIENT_ID")     || "1000.3LTHT9NFYOVTJVFXVLUZB1CK628EFM";
const ZOHO_CLIENT_SECRET = Deno.env.get("ZOHO_CLIENT_SECRET") || "401785f30aa5a4a479f40d7269eb91873078be7dbe";
const ZOHO_CRM_REFRESH   = Deno.env.get("ZOHO_CRM_REFRESH")   || "1000.8a8af82f0deb24e4e66c19192395ed29.6e5e3be3aa8274e6318c6aed2129db07";
const ZOHO_ACCOUNTS_URL  = "https://accounts.zoho.in/oauth/v2/token";
const ZOHO_CRM_API       = "https://www.zohoapis.in/crm/v2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
};

async function getCRMToken(): Promise<string> {
  const res = await fetch(ZOHO_ACCOUNTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type:    "refresh_token",
      client_id:     ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      refresh_token: ZOHO_CRM_REFRESH,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("CRM token refresh failed: " + JSON.stringify(data));
  return data.access_token;
}

async function createLead(token: string, leadData: any): Promise<any> {
  const res = await fetch(`${ZOHO_CRM_API}/Leads`, {
    method: "POST",
    headers: {
      "Authorization": `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      data: [{
        Last_Name:        leadData.last_name || leadData.full_name || "Unknown",
        First_Name:       leadData.first_name || "",
        Full_Name:        leadData.full_name || "",
        Company:          leadData.company || "Unknown",
        Title:            leadData.designation || "",
        Email:            leadData.email || "",
        Phone:            leadData.phone || "",
        Lead_Source:      leadData.lead_source || "Website",
        Description:      leadData.description || "",
        // Custom fields
        ...(leadData.whitepaper_title ? { Whitepaper_Title: leadData.whitepaper_title } : {}),
        ...(leadData.how_heard       ? { How_did_you_hear_about_us: leadData.how_heard } : {}),
      }]
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Create lead failed: " + JSON.stringify(data));
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const body = await req.json();
    const { action } = body;
    const token = await getCRMToken();

    if (action === "test") {
      return new Response(JSON.stringify({ success: true, message: "Zoho CRM connected" }), { headers: CORS });
    }

    if (action === "create_lead") {
      const result = await createLead(token, body.lead);
      return new Response(JSON.stringify({ success: true, result }), { headers: CORS });
    }

    throw new Error("Unknown action: " + action);
  } catch(e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 400, headers: CORS });
  }
});
