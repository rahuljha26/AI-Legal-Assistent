# 📧 AI Legal Assistant - Email Setup Guide

To get the automated email service working in your local or production environment, you need to configure an SMTP service. The system is designed to work perfectly with **Gmail** using an App Password.

## Step 1: Install Dependencies
The email service requires `reportlab` for PDF generation and `google-generativeai` for AI drafting.
Run the following in your `project` folder:
```bash
pip install reportlab google-generativeai python-dotenv
```

## Step 2: Set up Gmail App Password
You cannot use your standard Google password for security reasons. You must generate an App Password:

1. Go to your Google Account settings: [myaccount.google.com](https://myaccount.google.com/)
2. Navigate to **Security** on the left menu.
3. Under "How you sign in to Google", ensure **2-Step Verification** is turned ON.
4. Click on **2-Step Verification**, scroll to the bottom, and click on **App passwords**.
   *(Note: Sometimes Google hides this. You can search "App passwords" in the top search bar of your Google Account).*
5. Select "Mail" and "Other (Custom name)".
6. Type "AI Legal Assistant" and click **Generate**.
7. Google will give you a 16-character password in a yellow box (e.g., `abcd efgh ijkl mnop`). Copy it.

## Step 3: Configure `.env`
Create or open the `.env` file in the `project/` directory (where `manage.py` is).
Add the following keys exactly:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your.actual.email@gmail.com
EMAIL_HOST_PASSWORD=abcdefghijklmnop     <-- Your 16-character App Password (no spaces)
EMAIL_FROM_NAME="AI Legal Assistant"
GEMINI_API_KEY=your_gemini_api_key       <-- Required for the warm AI text generation
```

## Step 4: Testing
1. Ensure your Django server is running (`python manage.py runserver`).
2. Go to the frontend React app and ask for Legal Advice.
3. Click **"Email this advice"**.
4. Check your terminal running Django. You should see it connecting to SMTP and sending.
5. Check your Gmail inbox—you should have a beautifully formatted HTML email with a PDF attachment!

## Troubleshooting
- **Network Error / Connection Refused**: Check your firewall, or confirm your ISP doesn't block port 587.
- **Authentication Error**: Double-check your App Password. Make sure there are no spaces.
- **No PDF attached**: Ensure `reportlab` is installed correctly. The service will safely fallback to sending just the HTML email if the PDF fails.
