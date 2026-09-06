// Renders legal text with clickable email, website and privacy-policy links.
const INK = "#2d1521";

const PATTERN = /(rroba\.co\/privacy|hello@rroba\.co|rroba\.co)/g;

export function LegalText({ text, keyBase }: { text: string; keyBase: string }) {
  const parts = text.split(PATTERN);
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) => {
        const key = `${keyBase}-${i}`;
        if (part === "hello@rroba.co") {
          return (
            <a key={key} href="mailto:hello@rroba.co" style={{ color: INK, textDecoration: "underline" }}>
              {part}
            </a>
          );
        }
        if (part === "rroba.co/privacy") {
          return (
            <a
              key={key}
              href="https://rroba.co/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: INK, textDecoration: "underline" }}
            >
              {part}
            </a>
          );
        }
        if (part === "rroba.co") {
          return (
            <a
              key={key}
              href="https://rroba.co"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: INK, textDecoration: "underline" }}
            >
              {part}
            </a>
          );
        }
        return <span key={key}>{part}</span>;
      })}
    </>
  );
}
