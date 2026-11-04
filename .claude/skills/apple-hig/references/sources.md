# 出典

すべて Apple の一次資料。`.md` を付けると Markdown 版が取れる (例: `…/typography.md`)。

## 原則
- Design principles (2026-06-08 再掲): https://developer.apple.com/design/human-interface-guidelines/design-principles
- Liquid Glass 技術概要 (hierarchy / harmony / consistency): https://developer.apple.com/documentation/technologyoverviews/liquid-glass
- Adopting Liquid Glass: https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass

## Foundations (数値の出所)
- Typography: https://developer.apple.com/design/human-interface-guidelines/typography
- Layout: https://developer.apple.com/design/human-interface-guidelines/layout
- Accessibility: https://developer.apple.com/design/human-interface-guidelines/accessibility
- Color: https://developer.apple.com/design/human-interface-guidelines/color
- Materials: https://developer.apple.com/design/human-interface-guidelines/materials
- Motion: https://developer.apple.com/design/human-interface-guidelines/motion
- Dark Mode: https://developer.apple.com/design/human-interface-guidelines/dark-mode
- SF Symbols: https://developer.apple.com/design/human-interface-guidelines/sf-symbols
- VoiceOver: https://developer.apple.com/design/human-interface-guidelines/voiceover

## 部品とパターン (作るときに該当ページを読む)
- Components 一覧: https://developer.apple.com/design/human-interface-guidelines/components
- Patterns 一覧: https://developer.apple.com/design/human-interface-guidelines/patterns
- Buttons / Tab bars / Toolbars / Sidebars / Sheets / Alerts / Lists and tables / Navigation bars / Scroll views
  はいずれも `https://developer.apple.com/design/human-interface-guidelines/<slug>`

## 素材とツール
- Apple Design Resources (Figma / Sketch の UI キット、SF Pro / New York フォント、デバイスベゼル): https://developer.apple.com/design/resources/
- SF Symbols アプリ (6,900+ シンボル): https://developer.apple.com/sf-symbols/
- Accessibility Inspector (Xcode): https://developer.apple.com/documentation/accessibility/accessibility-inspector
- Accessibility Nutrition Labels: https://developer.apple.com/help/app-store-connect/manage-app-accessibility/overview-of-accessibility-nutrition-labels
- Landmarks サンプル (Liquid Glass の実装例): https://developer.apple.com/documentation/SwiftUI/Landmarks-Building-an-app-with-Liquid-Glass
- WCAG 2 (コントラスト計算の根拠): https://www.w3.org/TR/WCAG/

## WWDC セッション (設計の意図を知る)
- WWDC25 219 Meet Liquid Glass: https://developer.apple.com/videos/play/wwdc2025/219
- WWDC25 356 Get to know the new design system: https://developer.apple.com/videos/play/wwdc2025/356
- WWDC25 316 / 224 (アクセシビリティ): https://developer.apple.com/videos/play/wwdc2025/316 , https://developer.apple.com/videos/play/wwdc2025/224
- WWDC26 250 (Design principles): https://developer.apple.com/videos/play/wwdc2026/250
- WWDC26 220 (Accessibility): https://developer.apple.com/videos/play/wwdc2026/220
- WWDC24 10145 / 10151 (Motion, SF Symbols animation): https://developer.apple.com/videos/play/wwdc2024/10145

## 注意
- システムカラーの RGB 値はリリースごとに変わりうる。Apple は「ハードコードせず API を使え」としている。Web で模す場合も CSS 変数に閉じ込める。
- Design principles ページは 2026-06 に「再掲」された。それ以前の Clarity / Deference / Depth は旧版。
