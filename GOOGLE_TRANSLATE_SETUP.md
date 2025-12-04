# Google Cloud Translation API Setup

## Step 1: Get Your API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable **Cloud Translation API**:
   - Go to: https://console.cloud.google.com/apis/library/translate.googleapis.com
   - Click "Enable"
4. Create API Key:
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "API Key"
   - Copy the API key

## Step 2: Add API Key to Your Project

1. Open `.env` file in the root directory
2. Replace `YOUR_API_KEY_HERE` with your actual API key:
   ```
   VITE_GOOGLE_TRANSLATE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

## Step 3: Restart Development Server

```bash
npm run dev
```

## How It Works

- **Automatic Translation**: All text is translated on-the-fly using Google Translate API
- **Caching**: Translations are cached to reduce API calls
- **Fallback**: If API fails, English text is shown
- **Supported Languages**: 
  - English (en)
  - Hindi (hi)
  - Tamil (ta)
  - Telugu (te)

## Free Tier

- **$300 free credits** for 90 days (new Google Cloud accounts)
- After credits: **$20 per million characters**

## Usage

The app automatically translates all text when you change language using the language selector in the navigation menu.

## API Limits

- Be mindful of API usage to avoid exceeding free credits
- Translation results are cached to minimize repeated API calls
- Consider implementing pagination limits for large text blocks
