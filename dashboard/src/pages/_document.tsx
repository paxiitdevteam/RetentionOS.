import { Html, Head, Main, NextScript } from 'next/document';

/**
 * Default document shell so the tab title is never the generic "Document"
 * before per-page <Head> runs. Pages still override <title> via next/head.
 */
export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="RetentionOS — admin dashboard for churn reduction and retention flows." />
        <title>RetentionOS Dashboard</title>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
