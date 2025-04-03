import type { MetaFunction } from '@remix-run/node';

export const meta: MetaFunction = () => [{ title: 'DEX Creator API | Home' }];

export default function Index() {
  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        lineHeight: '1.4',
        padding: '2rem',
      }}
    >
      <h1>Welcome to DEX Creator</h1>
      <p>This is a Single Page Application built with Remix.</p>
      <div style={{ marginTop: '2rem' }}>
        <h2>Getting Started</h2>
        <ul>
          <li>
            <a href="https://remix.run/docs" target="_blank" rel="noreferrer">
              Remix Docs
            </a>
          </li>
          <li>
            <a
              href="https://github.com/OrderlyNetwork/dex-creator"
              target="_blank"
              rel="noreferrer"
            >
              GitHub Repository
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
