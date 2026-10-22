#!/bin/bash
# 監督者（Claude）把一則指令送給 Codex。參考 YUJIN-Workspaces 的 send-codex.sh，精簡成遊戲專案用。
# 用法（Claude 以背景 Bash 執行）：
#   supervisor/send-codex.sh <請求檔 req.md> <回覆檔 resp.md> [plan|build] [new]
#   plan  （預設）計畫討論：Codex 只能讀 repo，不能寫
#   build 施工：Codex 可以寫 repo（含 .git，才能 commit）
#   new   開新的 Codex 對話；沒寫就接續上一次的對話（記在 supervisor/.codex-session-id）
# 請求檔規則（不符就拒送）：
#   ・必須要求 Codex 用「繁體中文」回覆
#   ・可寫「模型：gpt-6-luna|gpt-6.1-sol」「思考度：medium|high」；沒寫＝plan 用 luna＋medium、build 用 sol＋medium
# 驗收檔守門：施工前後比對 BRIEF.md、VERIFY.md；被 Codex 改到就在回覆末尾標「越界」並 exit 10
set -u
REQ="$1"; RESP="$2"; MODE="${3:-plan}"; NEW="${4:-}"
case "$REQ" in /*) ;; *) REQ="$PWD/$REQ";; esac
case "$RESP" in /*) ;; *) RESP="$PWD/$RESP";; esac
DIR="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$DIR/.." && pwd)"
SIDF="$DIR/.codex-session-id"
LEDGER="$DIR/ledger.tsv"
LOG="${RESP%.md}.log"

[ -f "$REQ" ] || { echo "找不到請求檔 $REQ" >&2; exit 2; }
grep -q '繁體中文' "$REQ" || { echo "拒送：請求檔沒有要求 Codex 用繁體中文回覆" >&2; exit 4; }

case "$MODE" in
  plan)  DEF_MODEL=gpt-6-luna; SANDBOX=(-c sandbox_mode="read-only") ;;
  build) DEF_MODEL=gpt-6.1-sol; SANDBOX=(-c sandbox_mode="workspace-write" -c "sandbox_workspace_write.writable_roots=[\"$REPO/.git\",\"/private/tmp\"]") ;;
  *) echo "第三參數只能是 plan 或 build" >&2; exit 3 ;;
esac
MODEL=$(sed -n 's/^模型：[[:space:]]*\([A-Za-z0-9._-]*\).*/\1/p' "$REQ" | head -1); MODEL=${MODEL:-$DEF_MODEL}
EFFORT=$(sed -n 's/^思考度：[[:space:]]*\([A-Za-z]*\).*/\1/p' "$REQ" | head -1); EFFORT=${EFFORT:-medium}
case "$MODEL" in gpt-6-luna|gpt-6.1-sol) ;; *) echo "拒送：模型只准 gpt-6-luna 或 gpt-6.1-sol（寫的是 $MODEL）" >&2; exit 9 ;; esac
case "$EFFORT" in medium|high) ;; *) echo "拒送：思考度只准 medium 或 high（寫的是 $EFFORT）" >&2; exit 9 ;; esac

snap() { (cd "$REPO" && shasum -a 256 BRIEF.md VERIFY.md 2>/dev/null); }
BEFORE=$(snap)

[ -f "$LEDGER" ] || printf '時間\t請求\t模式\t模型\t思考度\t對話\n' > "$LEDGER"

# Codex 對話太長（最近一步讀入 > 20 萬 token）就自動開新對話；背景都在 repo 檔案裡，新對話照請求先讀（參考 YUJIN send-codex.sh）
LIMIT=${CODEX_CTX_LIMIT:-200000}
if [ "$NEW" != "new" ] && [ -s "$SIDF" ]; then
  ROLL=$(ls -t ~/.codex/sessions/*/*/*/rollout-*"$(cat "$SIDF")".jsonl 2>/dev/null | head -1)
  CTX=$( [ -n "$ROLL" ] && grep -o '"last_token_usage":{"input_tokens":[0-9]*' "$ROLL" | tail -1 | grep -o '[0-9]*$' )
  if [ "${CTX:-0}" -gt "$LIMIT" ]; then
    echo "Codex 對話讀入 $CTX token，超過 $LIMIT，改開新對話" >&2
    NEW=new
  fi
fi

run_codex() {  # $1 = 模型
  cd "$REPO"
  if [ "$NEW" = "new" ] || [ ! -s "$SIDF" ]; then
    codex exec "${SANDBOX[@]}" -c model="$1" -c model_reasoning_effort="$EFFORT" -o "$RESP" - < "$REQ" > "$LOG" 2>&1
    rc=$?
    SID=$(grep -m1 '^session id: ' "$LOG" | sed 's/^session id: //')
    [ -n "$SID" ] && echo "$SID" > "$SIDF"
  else
    SID=$(cat "$SIDF")
    codex exec resume "$SID" "${SANDBOX[@]}" -c model="$1" -c model_reasoning_effort="$EFFORT" -o "$RESP" - < "$REQ" > "$LOG" 2>&1
    rc=$?
  fi
}
run_codex "$MODEL"
# 模型容量已滿：只在計畫討論時改用另一個模型重送一次（施工中途重送可能重做一半的工作，交給監督者判斷）
if [ "$rc" != 0 ] && grep -q 'at capacity' "$LOG" && [ "$MODE" = plan ]; then
  OTHER=$([ "$MODEL" = gpt-6-luna ] && echo gpt-6.1-sol || echo gpt-6-luna)
  echo "$MODEL 容量已滿，改用 $OTHER 重送一次" >&2
  mv "$LOG" "${LOG%.log}.capacity.log"
  MODEL="$OTHER"; run_codex "$MODEL"
fi
printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$(date '+%F %T')" "$(basename "$REQ")" "$MODE" "$MODEL" "$EFFORT" "${SID:-?}" >> "$LEDGER"

AFTER=$(snap)
if [ "$BEFORE" != "$AFTER" ]; then
  printf '\n\n──────── send-codex 驗收檔守門 ────────\n本輪改到了 BRIEF.md 或 VERIFY.md，視同越界，監督者要退回。\n' >> "$RESP"
  echo "驗收檔越界（Codex rc=$rc）" >&2; exit 10
fi
exit $rc
