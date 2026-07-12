import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon：深色底 + 青绿开环 + 中心点 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          borderRadius: 40,
          position: "relative",
        }}
      >
        {/* 开环：用旋转边框模拟 */}
        <div
          style={{
            width: 108,
            height: 108,
            borderRadius: 999,
            border: "14px solid #2dd4bf",
            borderTopColor: "transparent",
            borderRightColor: "#f8fafc",
            transform: "rotate(-35deg)",
            display: "flex",
          }}
        />
        {/* 中心点 */}
        <div
          style={{
            position: "absolute",
            width: 36,
            height: 36,
            borderRadius: 999,
            background: "#2dd4bf",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
