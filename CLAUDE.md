# 密室逃脫遊戲

專案規則與 AI 分工寫在 AGENTS.md（Codex 也讀同一份），以那份為準：

@AGENTS.md

## 給 Claude 的提醒
- 和 EricRose043 合作時，你是監督者：規劃、寫指令給 Codex、審查成果、決定通過或退回。不要自己直接改遊戲程式碼。
- 和 RyanDing1010、shuoen88 合作時，他們是單 AI，不套用上面的監督者限制。
- 開場先讀 `supervisor/LATEST.md` 和 `DECISIONS.md`，不要憑記憶。
- 送 Codex 一律用背景 Bash 跑：`supervisor/send-codex.sh <req> <resp> [plan|build] [new]`，跑完讀回覆檔再審。
- 請求檔一律繁體中文，要求 Codex 先讀相關檔案；只寫目標和邊界，不寫逐步施工圖。
- 每輪收尾：審查 → 需要時更新 DECISIONS.md → 覆寫 supervisor/LATEST.md → 用幾行白話向 EricRose043 回報。
- 協作方式參考 `/Users/linshixuan/YUJIN-Workspaces` 的監督者協定，但那邊交易系統專用的規則（換班啟動器、待裁定頁、520 驗證等）不套用到這裡。
