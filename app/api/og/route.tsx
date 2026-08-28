import { ImageResponse } from "next/og";

export const runtime = "edge";

const TITLE_MAX = 200;
const EXCERPT_MAX = 400;
const FIELD_MAX = 80;

/** Old Safari UA so Google Fonts returns TTF/OTF that Satori can load. */
const FONT_UA =
  "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1";

function clip(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max).trimEnd();
}

async function loadFont(family: string, weight: number) {
  const css = await (
    await fetch(
      `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=swap`,
      { headers: { "User-Agent": FONT_UA } },
    )
  ).text();
  const url = css.match(/src: url\(([^)]+)\)/)?.[1];
  if (!url) throw new Error(`Font URL not found for ${family} ${weight}`);
  return fetch(url).then((r) => r.arrayBuffer());
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = clip(searchParams.get("title") ?? "Untitled", TITLE_MAX);
  const kicker = clip(searchParams.get("kicker") ?? "ABDUR R SAYEED", FIELD_MAX);
  const excerpt = clip(searchParams.get("excerpt") ?? "", EXCERPT_MAX);
  const path = clip(searchParams.get("path") ?? "abdur.ai", FIELD_MAX);
  const tag = clip(searchParams.get("tag") ?? "AI TLDR", FIELD_MAX);
  const meta = clip(searchParams.get("meta") ?? "", FIELD_MAX);
  const [interBold, interMedium, mono] = await Promise.all([
    loadFont("Inter", 800),
    loadFont("Inter", 500),
    loadFont("JetBrains+Mono", 600),
  ]);
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#050505",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          fontFamily: "Inter",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-200px",
            right: "-200px",
            width: "520px",
            height: "520px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(217,119,87,0.16), rgba(217,119,87,0) 70%)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: "#D97757",
              }}
            />
            <span
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: "16px",
                fontWeight: 600,
                color: "#F2EDE6",
                letterSpacing: "0.02em",
              }}
            >
              abdur.ai
            </span>
          </div>
          <span
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: "13px",
              color: "#6A6256",
              letterSpacing: "0.14em",
            }}
          >
            {tag}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: "960px",
          }}
        >
          <div
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: "13px",
              color: "#D97757",
              letterSpacing: "0.14em",
              marginBottom: "22px",
            }}
          >
            {kicker}
          </div>
          <div
            style={{
              fontSize: "64px",
              lineHeight: 1.08,
              fontWeight: 800,
              color: "#F5F2ED",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </div>
          {excerpt ? (
            <div
              style={{
                marginTop: "22px",
                fontSize: "20px",
                lineHeight: 1.5,
                color: "#948B7D",
                maxWidth: "820px",
              }}
            >
              {excerpt}
            </div>
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "26px",
            borderTop: "1px solid #1C1913",
          }}
        >
          <span
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: "14px",
              color: "#6A6256",
              letterSpacing: "0.02em",
            }}
          >
            {path}
          </span>
          <span
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: "14px",
              color: "#6A6256",
              letterSpacing: "0.02em",
            }}
          >
            {meta}
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
      fonts: [
        { name: "Inter", data: interBold, weight: 800, style: "normal" },
        { name: "Inter", data: interMedium, weight: 500, style: "normal" },
        { name: "JetBrains Mono", data: mono, weight: 600, style: "normal" },
      ],
    },
  );
}
