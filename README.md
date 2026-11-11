# Clear Answer

Clear Answer is a responsive, keyboard-friendly calculator for everyday arithmetic. It supports the four basic operations, decimals, percentages, backspace, repeated equals, and a session-only calculation history.

## Features

- Addition, subtraction, multiplication, and division
- Decimal and percentage input
- Clear-all and backspace controls
- Keyboard support for digits, operators, Enter, Escape, Backspace, and percent
- Repeated equals for repeating the last operation
- Division-by-zero error handling
- Recent calculation history for the current page session
- Responsive layout with visible keyboard focus states

## Getting started

Requirements: Node.js and npm.

Install dependencies and start the development server:

```bash
npm ci
npm run dev
```

Open the development server at `http://localhost:3000`.

## Live preview

This repository includes a managed preview contract in `.revolte/preview.json`. Start the preview with:

```bash
revolte-preview ensure --wait
```

The preview uses port `4173` and binds to `0.0.0.0` for platform access.

## Available scripts

```bash
npm run dev          # Start the development server
npm run build        # Create a production build
npm run start        # Serve the production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript without emitting files
npm run format       # Format the repository with Prettier
```

## Usage

Click the keypad or use the keyboard. Press `Enter` or `=` to calculate, `Escape` to clear, `Backspace` to delete the last digit, and `%` to convert the current number to a percentage. Completed calculations appear in the Recent work panel and remain available until the page is refreshed or the history is cleared.

## Technical notes

The calculator is implemented as a client-side Next.js App Router screen using TypeScript and Tailwind CSS. It does not use a database or API because calculation history is intentionally limited to the current page session.

## Project structure

- `src/app/page.tsx` — calculator interaction logic and page structure
- `src/app/globals.css` — visual tokens, layout, and interaction styles
- `src/app/layout.tsx` — document metadata and root layout
- `.revolte/preview.json` — live preview environment contract
