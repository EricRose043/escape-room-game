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

## LOG-07 合併證據（最新）

Ryan 鎖定 fc603adece9baf554cdbd87d291b9d21ba7e3954，相對 main 0fab5ef 有 67 筆提交，git shortlog 皆為 RyanDing1010。b2066d2 以真正 merge commit 匯入，保留 Ryan、Eric 與 shuoen 的原始 SHA／作者，未 squash、rebase、force push 或冒用他人身分。d87b510／54ae26f 為 shuoen88 的本輪回歸與修復，PR #2 延續上傳。舊表45筆為上一輪快照；目前67筆不包含鎖定SHA之後的更新。尚未 main 合併，不能宣稱三人均已在 main 完成交付。

## LOG-08 再核對

本輪再次核對main=0fab5ef、Ryan=fc603ad；git merge-base --is-ancestor確認兩者與上輪8dfc46f均在最新分支歷史。Ryan67筆提交未重寫；shuoen88以本人的既有Git身分新增S2／S3、測試與文件提交。仍走PR #2上傳，不直接推main、不squash、不force push。本輪未代表Ryan／Eric認可新的驗收含義，也沒有代發訊息要求其驗收；待owner merge後才核對main三人歷史。

## 2026-11-01 owner 審查與整合

[PR #4](https://github.com/EricRose043/escape-room-game/pull/4) 納入本輪檢查時的三個來源 HEAD：

| 原始分支 | HEAD | 整合版祖先核對 |
|---|---|---|
| shuoen/team-roles-and-test-plan | 3072dfa | PASS |
| shuoen/save-playtest-and-audio | 42d8357 | PASS |
| ryan/color-puzzle | 05b290b | PASS |

65ed422 為真正 merge commit，保留 Ryan 新增 R1／R2／STORY 及既有劇情全部提交，也保留 shuoen 的分工、測試、音效、設定與走廊成果。owner 的 270de89／e6a8a53／107609f 等提交記錄實際串接與修復，不將別人工作改寫為 owner 作者。

核對方法：`git merge-base --is-ancestor <來源完整SHA> <整合HEAD>`；三者成功。main 的最後追溯以 PR #4 合併後對其 merge SHA 執行同一命令為準。原分支與 PR #1／#2／#3 均不刪除、不改寫；不製造 Ryan／shuoen 的新 commit 或共同作者宣告。

本輪與原 main 的作者差異可由 `git shortlog -s origin/main..codex/github-team-integration` 重現；不把尚未進 main 的歷史冒稱已在 main。PR 即時狀態是合併與交付狀態的依據。

## 2026-11-04 main正式追溯完成

鎖定main 6ff1d44cf5114197d99aeef54eae101a5b2bbe53，對3072dfa、42d8357、05b290b、80fbb65及c571347執行git merge-base --is-ancestor，五者皆成功（原始完整SHA與結果見本輪verification.json）。所以分工、shuoen全部S0/S1/S2/S3與Ryan兩輪成果均已可從main追溯，不再保留「尚未進main」作目前判斷。

git shortlog -sn origin/main當時為RyanDing1010 95、EricRose043 81、shuoen88 25筆，這是Git作者提交數，並非工作量評分。PR #1、#4、#5為MERGED，#2雖CLOSED但原SHA已在main，不能把關閉解讀成貢獻遺失。本輪新測試／修復用shuoen88既有真實身分提交，從最新main開新分支，不force push或重寫歷史。

## 2026-11-05 本機沉浸感候選

依shuoen試玩回饋，本輪以shuoen88既有真實身分提交聲音、滑鼠、近景、材質、漸進難度、自動解析度及測試，六組TDD紅／綠提交見LOG-20261105-IMMERSION。da6f4e6以merge納入Eric的main fffe647啟動器修復，原main與Ryan／shuoen來源提交均保留祖先鏈；沒有force push、rebase或squash。新增整合與調整不改Ryan原劇情／謎題及Eric場景／抓捕設計的作者歸屬。

這批候選目前**僅存在本機**；依S-D034，使用者確認順暢後才推送。不能將本機commit存在描述成已上GitHub或main已合併，也未替其他成員發訊息／宣告驗收。
