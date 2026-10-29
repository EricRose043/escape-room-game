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
| RyanDing1010 | 劇情與素材 | story/toy-factory-draft 的 45 筆提交，最後鎖定 8bf3e2f | 最後快照已核對 45 筆作者均為 RyanDing1010；尚未合併 main、沒有對應 PR |
| shuoen88 | 測試與整合 | 本次 `shuoen/team-roles-and-test-plan` 文件提交與後續 PR；原始 SHA 見該分支歷史 | 本次提交使用 shuoen88 真實帳號；main 合併後再核對 |

目前不能宣稱三人都已在 main 留下 commit。Ryan 的本人工作已在新分支核對，後續由本人開 PR、owner 審查合併後再核對 main；本輪不替他製造或重寫任何紀錄。

## 後續貢獻填寫

| 日期 | 本人帳號 | 實際交付 | 分支／PR | 原始 commit | 驗收／實測紀錄 | main 可追溯確認 |
|---|---|---|---|---|---|---|
| 待填 | 待本人填寫 | 待填 | 待填 | 待填 | 待填 | 未檢查 |

每次合併追加，不以合併者姓名覆蓋原作者。若使用者介面沒有 merge commit 選項，由 Eric 檢查儲存庫設定並協調，不改用會壓掉歷史的方式來交件。

## 本次 S0／S1 的真實提交（shuoen88）

- 分支 `shuoen/save-playtest-and-audio`，承接 3072dfa（PR #1）後新增工作，不改寫任何既有 commit。
- `95e84cb`：實際 WebGL 被抓及存檔測試、實測證據與限制。
- `f312257`：S1 測試先紅。
- `9056b86`：S1 獨立模組與瀏覽器訊號驗證，180/180 通過。
- 隨後文件提交：整理 S1 接入說明、缺陷與換行；以本分支歷史核對 SHA。
- 以上均由 shuoen88 身分提交；尚待 Eric 使用 merge commit 合併。Ryan 的貢獻仍待本人提交，未冒用其身分。

## 最新補查（2026-10-29）

Ryan 分支 aace2e6 相對 main=0fab5ef 有 34 筆提交，git author 均為 RyanDing1010；不再以舊的 main-only 查核推定他沒有貢獻。提交已存在與程式驗收通過分開判定；目前列車回歸有失敗，詳 PROGRESS／LOG-05。main、PR #1／#2 的舊 SHA 與作者均未改寫。

最新補查補充：測試期間 Ryan 又新增 11 筆，最後鎖定 8bf3e2f，共 45 筆作者均為 RyanDing1010。34 筆是本輪第一快照 aace2e6，不是最終數字；原始提交皆保留。兩套音效各自有作者證據，整合衝突不能以刪除任一方貢獻解決。
