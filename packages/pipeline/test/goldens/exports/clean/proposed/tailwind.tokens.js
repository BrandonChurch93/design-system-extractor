/* Design System Extractor · localhost:4100 · run evalclean0 · proposed set · 2026-10-12 */
module.exports = {
  "theme": {
    "extend": {
      "colors": {
        "gray": {
          "50": "#FFFFFF",
          "200": "#E2E8F0",
          "600": "#5F6368"
        },
        "text": {
          "primary": "#0B1F3A",
          "primary/12": "rgb(11 31 58 / 12%)",
          "primary/60": "rgb(11 31 58 / 60%)"
        },
        "blue": {
          "600": "#2458E6"
        },
        "teal": {
          "500": "#0F8A8A"
        },
        "success": "#15803D",
        "warning": "#B45309",
        "danger": "#DC2626",
        "white/8": "rgb(255 255 255 / 8%)"
      },
      "fontFamily": {
        "sans": [
          "Inter",
          "system-ui",
          "sans-serif"
        ],
        "mono": [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace"
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
        "text-small": [
          "14px",
          {
            "lineHeight": "22px",
            "fontWeight": "400"
          }
        ],
        "code": [
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
        "md": "12px",
        "rounded": "9999px"
      },
      "boxShadow": {
        "stack-low": "0px 1px 2px 0px #0B1F3A1F",
        "md": "0px 12px 32px 0px #0B1F3A1F"
      },
      "transitionDuration": {
        "120": "120ms",
        "160": "160ms",
        "240": "240ms",
        "480": "480ms",
        "1600": "1600ms",
        "fast": "120ms",
        "base": "160ms",
        "slow": "240ms",
        "slower": "480ms"
      },
      "transitionTimingFunction": {
        "out-quad": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        "out-quart": "cubic-bezier(0.25, 1, 0.5, 1)"
      },
      "keyframes": {
        "fade-up": {
          "0%": {
            "opacity": "0",
            "transform": "translateY(12px)"
          },
          "100%": {
            "opacity": "1",
            "transform": "none"
          }
        },
        "pulse": {
          "0%, 100%": {
            "opacity": "1"
          },
          "50%": {
            "opacity": "0.4"
          }
        }
      },
      "animation": {
        "fade-up": "fade-up 480ms cubic-bezier(0.25, 1, 0.5, 1)",
        "pulse": "pulse 1600ms cubic-bezier(0.25, 1, 0.5, 1) infinite"
      },
      "screens": {
        "sm": "640px",
        "md": "1024px",
        "lg": "1280px"
      }
    }
  }
};
