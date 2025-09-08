import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import "react-toastify/dist/ReactToastify.css";
import "./styles/global.css";

export default function App() {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/webp" href="/favicon.svg" />
        <title>Orderly One</title>
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <ScrollRestoration />
        <Scripts />
        <Outlet />
      </body>
    </html>
  );
}
