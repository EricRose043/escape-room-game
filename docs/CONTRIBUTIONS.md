# 貢獻與 Git 作者紀錄

統整：shuoen88；實際貢獻由本人提交；EricRose043 最終審查合併。

## 保留方式

1. 各人在自己的分支提交真實工作，先檢查 repo 的 `git config user.name`／`user.email` 對應本人 GitHub。可使用自己帳號的 GitHub noreply 地址；不要冒用組員或更改舊作者。
2. 開 PR，列出完成內容、TESTS 案例、測試結果與原始 commit。文件、劇情、素材來源、測試及修復都是可核對的貢獻；不要為了數量建立空 commit。
3. Eric 審查後使用 **Create a merge commit**。本團隊流程不用 squash／rebase 合併，不 force push、不重寫已共享歷史。此為合作規範，尚未替 repo 啟用強制合併設定。
4. 合併後 shuoen88 以 `git log --format="%h %an <%ae> %s" main` 核對，並用 `git merge-base --is-ancestor <原始SHA> main` 確認原始 commit 可由 main 追溯。
5. 作者、PR 發起者與合併者可不同；以原始 commit 作者及內容為準。共同作者只在真的共同工作並經本人確認時加入，不替別人補造歷史。

## 現況與證據

| 成員 | 主責 | 可核對的紀錄 | 狀態 |
|---|---|---|---|
| EricRose043 | 網站與機關 | 本輪起點 `0fab5ef6758b25234c523d6a5a05e5f059ab7cee`；截至該版本 main 可讀的 65 筆 commit，其 GitHub author 皆為 EricRose043 | 既有 main 紀錄保留；不改寫 |
| RyanDing1010 | 劇情與素材 | 待本人 PR／原始 commit | main 尚未核對到 Ryan 的作者紀錄；不推定其他分支是否已有成果 |
| shuoen88 | 測試與整合 | 本次 `shuoen/team-roles-and-test-plan` 文件提交與後續 PR；原始 SHA 見該分支歷史 | 本次提交使用 shuoen88 真實帳號；main 合併後再核對 |

目前不能宣稱三人都已在 main 留下 commit。此文件建立保留及核對流程；Ryan 必須由本人完成實際工作後提交，本輪不替他製造紀錄。

## 後續貢獻填寫

| 日期 | 本人帳號 | 實際交付 | 分支／PR | 原始 commit | 驗收／實測紀錄 | main 可追溯確認 |
|---|---|---|---|---|---|---|
| 待填 | 待本人填寫 | 待填 | 待填 | 待填 | 待填 | 未檢查 |

每次合併追加，不以合併者姓名覆蓋原作者。若使用者介面沒有 merge commit 選項，由 Eric 檢查儲存庫設定並協調，不改用會壓掉歷史的方式來交件。
