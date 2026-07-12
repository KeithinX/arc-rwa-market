import { ImageResponse } from "next/og";

export const alt = "Arc RWA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** 分享图：与 favicon / Apple icon 同色同标 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          background: "#f4f7f6",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: "#0f172a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 999,
                border: "8px solid #2dd4bf",
                borderTopColor: "transparent",
                borderRightColor: "#f8fafc",
                transform: "rotate(-35deg)",
                display: "flex",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: 18,
                height: 18,
                borderRadius: 999,
                background: "#2dd4bf",
                display: "flex",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              color: "#0f172a",
              fontSize: 56,
              fontWeight: 700,
              letterSpacing: -1,
            }}
          >
            Arc RWA
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 40, fontWeight: 600, color: "#0f172a", letterSpacing: -0.5 }}>
            RWA prediction markets on Arc
          </div>
          <div style={{ fontSize: 28, color: "#475569" }}>Settled in USDC · Arc Testnet</div>
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
            height: 8,
            borderRadius: 999,
            background: "#e8eeec",
            overflow: "hidden",
          }}
        >
          <div style={{ width: "62%", height: "100%", background: "#0f766e" }} />
          <div style={{ width: "38%", height: "100%", background: "#dc2626" }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
