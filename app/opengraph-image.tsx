import { ImageResponse } from "next/og";

export const alt = "Вне дома — социальные активности в Туле";
export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          color: "#172026",
          background:
            "linear-gradient(135deg, #f7faf9 0%, #e9f4ef 44%, #dcebe7 100%)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#1f8a70",
              color: "white",
              fontSize: 36,
              fontWeight: 800
            }}
          >
            В
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 34, fontWeight: 800 }}>Вне дома</div>
            <div style={{ fontSize: 22, color: "#5f6f7a" }}>Тула</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 940 }}>
          <div
            style={{
              alignSelf: "flex-start",
              borderRadius: 999,
              padding: "12px 22px",
              background: "white",
              color: "#1f8a70",
              fontSize: 24,
              fontWeight: 700
            }}
          >
            Игры · танцы · прогулки · клубы
          </div>
          <h1 style={{ margin: "28px 0 0", fontSize: 72, lineHeight: 1.04, fontWeight: 900 }}>
            Найдите, чем заняться в Туле
          </h1>
          <p style={{ margin: "28px 0 0", maxWidth: 880, fontSize: 30, lineHeight: 1.35, color: "#33424a" }}>
            Места, куда можно прийти одному, познакомиться с людьми и сделать что-то вместе.
          </p>
        </div>
      </div>
    ),
    size
  );
}
