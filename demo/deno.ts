import { Bot, webhookCallback } from "https://lib.deno.dev/x/grammy@v1/mod.ts";
import { Buffer } from "node:buffer";
import { createSign, createVerify } from "node:crypto";

const WEBHOOK_BASE_DOMAIN = Deno.env.get("WEBHOOK_BASE_DOMAIN");
const privateKey = Buffer.from(Deno.env.get("B64_PRIVATE_KEY"), "base64").toString("utf-8");
const publicKey = Buffer.from(Deno.env.get("B64_PUBLIC_KEY"), "base64").toString("utf-8");
const BOT_TOKEN = Deno.env.get("BOT_TOKEN");
const bot = new Bot(BOT_TOKEN);

function toBase64Url(str: string) {
    return Buffer.from(str, "utf-8").toString("base64url");
}

bot.command('start', async ctx => {
    const TMAFormBaseUrl = "https://tmaform-ybaxw.kinsta.page/";
    const TMAFormTitle = "My Demo Form";
    const TMAFormCBUrl = `${WEBHOOK_BASE_DOMAIN}/submitForm`;
    const TMAFormSchema = [
        { key: "username", label: "Telegram Username", required: true, type: "string" },
        {
            key: "libraries",
            label: "Libraries Used",
            required: true,
            type: "multiselect",
            options: [
                "@grammyjs/conversations",
                "@grammyjs/runner",
                "@grammyjs/auto-retry",
                "@grammyjs/i18n",
                "@grammyjs/hydrate",
            ]
        }
    ];
    const TMAFormMetadata = {
      username: ctx.from?.username,
      userid: ctx.from?.id,
      chatid: ctx.chat.id,
      form: TMAFormSchema,
    };

    const b64Title = toBase64Url(TMAFormTitle);
    const b64CBUrl = toBase64Url(TMAFormCBUrl);
    const b64Schema = toBase64Url(JSON.stringify(TMAFormSchema));
    const b64Metadata = toBase64Url(JSON.stringify(TMAFormMetadata));

    const signer = createSign("SHA256");
    signer.write(b64Metadata);
    signer.end();
    const b64Signature = signer.sign(privateKey, "base64url");
    console.log(b64Signature);

    const TMAFormUrl = `${TMAFormBaseUrl}?title=${b64Title}&callbackUrl=${b64CBUrl}&form=${b64Schema}&metadata=${b64Metadata}&signature=${b64Signature}`;
    await ctx.reply('TMAForm Demo', {
        reply_markup: {
            inline_keyboard: [[
                { text: 'TMAForm Demo', web_app: { url: TMAFormUrl } },
            ]]
        }
    });
});

const handleUpdate = webhookCallback(bot, "std/http");

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const firstPath = url.pathname.slice(1);
  if (req.method === "OPTIONS") {
    if (firstPath === "submitForm") {
      return new Response(null, { status: 200, headers: {
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Origin": "*",
      }});
    }
  } else if (req.method === "POST") {
    if (firstPath === BOT_TOKEN) {
      try {
        return await handleUpdate(req);
      } catch (err) {
        console.error(err);
      }
    } else if (firstPath === "submitForm") {
        const bodyJson = await req.json();
        console.log(bodyJson);

        const metadata = bodyJson.metadata;
        const signature = bodyJson.signature;
        const verifier = createVerify("SHA256");
        verifier.write(metadata);
        verifier.end();
        const verified = verifier.verify(publicKey, signature, "base64url");
        
        // Once we have proven that the metadata is not tampered with, we can 
        // perform validation of form fields against those in metadata
        // as well as rely on custom metadata fields we might have added (e.g. userid in this case)
        if (verified) {
          return new Response(null, { status: 200, headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Origin": "*",
          }});
        }
    }
  }
  return new Response(null, { status: 404, headers: {
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*",
    "Access-Control-Allow-Origin": "*",
  }});
});
