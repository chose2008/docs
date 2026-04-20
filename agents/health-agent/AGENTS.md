# HealthAgent Configuration

## Agent Identity
- **Name**: health-agent
- **Display Name**: 医疗档案助手
- **Description**: 整理和分析病案资料，提供就医提醒服务
- **Emoji**: 🏥

## Model Configuration
- **Model**: kimi/k2p5
- **Thinking Level**: off
- **Context Window**: 200k

## Data Directories
- **Health Records**: /root/.openclaw/workspace/health-records/
- **Agent Workspace**: /root/.openclaw/workspace/agents/health-agent/

## Reminder Channels
- **Primary**: feishu (即时消息)
- **Secondary**: email (详细报告)

## Cron Schedule
- **Daily Check**: 0 9 * * * (每天上午9点)
- **Weekly Report**: 0 9 * * 1 (每周一上午9点)
- **Monthly Summary**: 0 9 1 * * (每月1日上午9点)

## Privacy Settings
- **Data Storage**: Local only
- **External Sync**: Disabled
- **Log Sensitivity**: High (redact medical data)

## Access Control
- **Owner**: ou_78966c76f1685c56e8123127029caafc
- **Visibility**: Private
