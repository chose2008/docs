#!/bin/bash
# HealthAgent 每日检查脚本
# 由 cron 调用，检查提醒事项

HEALTH_DIR="/root/.openclaw/workspace/health-records"
INDEX_FILE="$HEALTH_DIR/index.md"

echo "=== HealthAgent 每日检查 $(date '+%Y-%m-%d %H:%M') ==="

# 检查索引文件是否存在
if [ ! -f "$INDEX_FILE" ]; then
    echo "错误：索引文件不存在"
    exit 1
fi

# 解析即将到期的提醒
# TODO: 实现提醒逻辑

echo "检查完成"
