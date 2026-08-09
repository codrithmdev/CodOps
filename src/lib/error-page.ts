export function renderErrorPage(): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Error</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 2rem; text-align: center; }
      h1 { color: #dc2626; }
      p { color: #6b7280; }
    </style>
  </head>
  <body>
    <h1>Something went wrong</h1>
    <p>An unexpected error occurred. Please try again later.</p>
  </body>
</html>
  `.trim();
}
