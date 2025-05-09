# **App Name**: TeleForm

## Core Features:

- Parameter Decoding: Decode URL parameters including title, description, form definition, and callback URL using base64 URL safe decoding.
- Dynamic Form Rendering: Dynamically render form fields based on the decoded JSON form definition, supporting types: string, number, boolean, date, email, tel, and select.
- Client-Side Validation: Implement client-side validation to ensure required fields are filled before submission, providing user-friendly error messages.
- Form Submission: Construct and POST form data as JSON to the callback URL upon successful validation, handle success and error responses, and provide appropriate UI feedback.
- Telegram Integration: Integrate with the Telegram Mini App SDK for initialization, theming, MainButton management, and closing the Mini App.

## Style Guidelines:

- Primary color: Telegram's primary blue to align with the platform's branding.
- Secondary color: Light gray or a subtle off-white for backgrounds to provide contrast.
- Accent: A shade of green (#4CAF50) to signal success states (e.g., successful submission).
- Use a clear and legible sans-serif font that is readable within the Telegram interface.
- Utilize simple, recognizable icons from a standard library (e.g., Material Design Icons) to enhance usability (e.g., a submit icon on the submit button).
- Vertically stacked form fields with clear labels above the inputs for easy scanning and completion on mobile devices.