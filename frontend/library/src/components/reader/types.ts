export type ReaderMode = "scroll" | "page";
export type ReaderTheme = "day" | "night" | "sepia";
export type ReaderFontFamily = "serif" | "sans";

export type ReaderSettings = {
  fontSize: "sm" | "md" | "lg";
  lineSpacing: "compact" | "normal" | "relaxed";
  fontFamily: ReaderFontFamily;
  theme: ReaderTheme;
  width: "narrow" | "normal" | "wide";
  brightness: number; // 0..100
  mode: ReaderMode;
};


