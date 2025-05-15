# TMAForm - Telegram Mini App Form Renderer

> [!CAUTION]
> This repository has been vibe-coded by Gemini 2.5 Pro Experimental on Firebase Studio, and has not been reviewed by human eyes.

> [!TIP]
> Ideally, you should clone this repository and review the code manually before publishing it to any static site hosting platform.

> [!TIP]
> Check out the /demo folder for an example of how to send TMAForm via your bot, and receive data on form submission.

This Next.js application, built with Firebase Studio, serves as a dynamic form renderer and data collector for Telegram bots. It operates as a Static Site Generated (SSG) Single Page Application (SPA).

## Core Purpose

Bots can construct a URL to launch this Mini App, providing necessary parameters like form title, description, structure (as JSON), and a callback destination. Users can then fill out and submit these forms seamlessly within the Telegram interface.

## Features

- **Dynamic Form Rendering**: Forms are rendered client-side based on JSON definitions passed via URL parameters.
- **Supported Field Types**: `string`, `number`, `boolean`, `date`, `email`, `tel`, `select`.
- **Client-Side Validation**: Ensures required fields are completed before submission.
- **Telegram Mini App SDK Integration**: Utilizes `window.Telegram.WebApp` for UI elements like the MainButton, theming, and lifecycle management.
- **Secure Parameter Handling**: URL parameters are base64 URL safe encoded and decoded client-side.
- **User Feedback**: Clear success and error messages are displayed within the app.

## Initialization via URL Parameters

The Mini App is launched with the following URL query parameters (all base64url encoded):

- `title`: (String, Mandatory) The main title for the form.
- `form`: (String, Mandatory) A JSON string representing an array of field definition objects.
- `callbackUrl`: (String, Mandatory) The absolute URL to which the collected form data will be POSTed.
- `description`: (String, Optional) Additional descriptive text for the form.

## Development

This project is built with Next.js and Tailwind CSS, leveraging ShadCN UI components.

To get started:

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Run the development server: `npm run dev`

The application will be available at `http://localhost:9002` (or the port specified in your `package.json`).

To test parameter decoding and form rendering, you can manually construct a URL with encoded parameters, e.g.:
`http://localhost:9002/?title=...&form=...&callbackUrl=...`

## Building for Production (SSG)

To build the static site:
`npm run build`

This will generate static HTML, CSS, and JavaScript files in the `out` directory, ready for deployment.
The Next.js configuration `output: 'export'` in `next.config.ts` enables this SSG behavior.

## Generating keys for signature verification

```ts
import { generateKeyPairSync } from "node:crypto";
import { Buffer } from "node:buffer";

const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 4096 });
const publicKeyB64 = Buffer.from(publicKey.export({ type: "pkcs1", format: "pem" }), "utf-8").toString("base64");
const privateKeyB64 = Buffer.from(privateKey.export({ type: "pkcs1", format: "pem" }), "utf-8").toString("base64");

console.log("Public Key in Base64:");
console.log(publicKeyB64);
console.log("Private Key in Base64:");
console.log(privateKeyB64);
```
