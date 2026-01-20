# Trade Mini App

A basic Telegram Mini App project built with React, TypeScript, Next.js, and @telegram-apps/telegram-ui.

## Features

- Next.js 14 with TypeScript
- Telegram UI components library
- Tailwind CSS for styling
- Minimal, functional setup for further development

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

- `app/page.tsx` - Main page with Telegram UI components
- `app/layout.tsx` - Root layout with metadata
- `app/globals.css` - Global styles with Tailwind
- Configuration files for Next.js, TypeScript, Tailwind, and PostCSS

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Technologies

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [@telegram-apps/telegram-ui](https://github.com/Telegram-Mini-Apps/telegram-ui) - Telegram UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

## Acceptance Criteria Met

- ✅ Next.js project initialized with TypeScript and React
- ✅ @telegram-apps/telegram-ui installed and imported without errors
- ✅ Development server starts on localhost:3000 with `npm run dev`
- ✅ Main page renders multiple Telegram UI components (Button, Cell, Section)
- ✅ TypeScript compilation passes with strict mode
- ✅ Build command `npm run build` completes successfully

## Next Steps

This is a minimal setup. For production Telegram Mini App development, consider:

1. Integrating Telegram Web App SDK for initialization and platform features
2. Adding proper theming and dark/light mode support
3. Implementing routing for multiple pages
4. Adding state management (e.g., Zustand, Redux)
5. Setting up API integration

## License

MIT