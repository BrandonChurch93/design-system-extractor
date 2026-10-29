/* Design System Extractor · localhost:4100 · run evalmessy0 · proposed set · 2026-10-12 */
module.exports = {
  "theme": {
    "extend": {
      "colors": {
        "gray": {
          "50": "#FFFFFF",
          "300": "#D1D1D1",
          "400": "#B1B1B1",
          "500": "#868686",
          "600": "#676767",
          "700": "#505050",
          "800": "#353535",
          "900": "#1F1F1F",
          "300b": "#C4C4C4",
          "700/30": "rgb(80 80 80 / 30%)",
          "800/20": "rgb(53 53 53 / 20%)"
        },
        "blue": {
          "600": "#2458E6",
          "900": "#0B1F3A",
          "600-alt": "#1C4EDB",
          "900/12": "rgb(11 31 58 / 12%)"
        },
        "teal": {
          "500": "#0F8A8A"
        },
        "success": "#15803D",
        "danger": "#DC2626",
        "warning": "#F59E0B",
        "black/4": "rgb(0 0 0 / 4%)"
      },
      "fontFamily": {
        "sans": [
          "Inter",
          "system-ui",
          "sans-serif"
        ]
      },
      "fontSize": {
        "display": [
          "48px",
          {
            "lineHeight": "56px",
            "fontWeight": "700"
          }
        ],
        "title": [
          "36px",
          {
            "lineHeight": "44px",
            "fontWeight": "700"
          }
        ],
        "title-sm": [
          "28px",
          {
            "lineHeight": "36px",
            "fontWeight": "700"
          }
        ],
        "subheading": [
          "20px",
          {
            "lineHeight": "28px",
            "fontWeight": "600"
          }
        ],
        "body": [
          "16px",
          {
            "lineHeight": "26px",
            "fontWeight": "400"
          }
        ],
        "text-14": [
          "14px",
          {
            "lineHeight": "20px",
            "fontWeight": "600"
          }
        ],
        "body-xs": [
          "14px",
          {
            "lineHeight": "22px",
            "fontWeight": "400"
          }
        ],
        "caption": [
          "12px",
          {
            "lineHeight": "16px",
            "fontWeight": "400"
          }
        ]
      },
      "spacing": {
        "4": "4px",
        "8": "8px",
        "12": "12px",
        "16": "16px",
        "20": "20px",
        "24": "24px",
        "32": "32px",
        "40": "40px",
        "48": "48px",
        "64": "64px",
        "96": "96px"
      },
      "borderRadius": {
        "sm": "8px",
        "md": "10px",
        "lg": "12px",
        "pill": "9999px"
      },
      "boxShadow": {
        "sm": "0px 1px 2px 0px #0B1F3A1F",
        "md": "0px 12px 32px 0px #0B1F3A1F"
      },
      "transitionDuration": {
        "100": "100ms",
        "120": "120ms",
        "150": "150ms",
        "160": "160ms",
        "200": "200ms",
        "250": "250ms",
        "300": "300ms",
        "400": "400ms",
        "1600": "1600ms",
        "faster": "120ms",
        "fast": "150ms",
        "base": "160ms",
        "slow": "200ms",
        "slower": "250ms"
      },
      "transitionTimingFunction": {
        "out-quad": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        "out": "ease-out",
        "ease": "ease",
        "linear": "linear",
        "custom-1": "cubic-bezier(0.4, 0, 0.2, 1)",
        "in-out": "ease-in-out"
      },
      "keyframes": {
        "pulse": {
          "0%, 100%": {
            "opacity": "1"
          },
          "50%": {
            "opacity": "0.3"
          }
        }
      },
      "animation": {
        "pulse": "pulse 1600ms ease-in-out infinite"
      },
      "screens": {
        "sm": "640px",
        "md": "1024px"
      }
    }
  }
};
