<div align="center">
  <p style="font-size: 18px;">An open-source App Store discount tracker built on GitHub Actions, with RSS, Telegram, and DingTalk notifications</p>

  English | [简体中文](https://github.com/appstore-discounts/appstore-discounts/blob/main/README_zh-CN.md)

  [![github-stars](https://img.shields.io/github/stars/eyelly-wu/appstore-discounts?style=social "github-stars")](https://github.com/appstore-discounts/appstore-discounts/stargazers "github-stars")
  [![github-issues](https://img.shields.io/github/issues-raw/eyelly-wu/appstore-discounts "github-issues")](https://github.com/appstore-discounts/appstore-discounts/issues "github-issues")
</div>

# App Store Discounts

Track discounted paid apps and in-app purchases across multiple App Store regions, then receive updates through RSS, Telegram, or DingTalk.

## Why It Exists

App prices change often, and checking them manually is tedious. This project watches ranked paid apps, detects discounts automatically, and publishes updates for the regions you care about.

## What It Supports

- Multiple App Store countries and regions
- Paid app and in-app purchase price tracking
- RSS feeds
- Telegram notifications
- DingTalk notifications
- Automatic refresh through GitHub Actions

## Subscribe

### RSS

| Code | Country or Region | Feed |
| --- | --- | --- |
| `cn` | Mainland China | [RSS](https://raw.githubusercontent.com/appstore-discounts/appstore-discounts/main/rss/cn.xml) |
| `hk` | Hong Kong, China | [RSS](https://raw.githubusercontent.com/appstore-discounts/appstore-discounts/main/rss/hk.xml) |
| `mo` | Macao, China | [RSS](https://raw.githubusercontent.com/appstore-discounts/appstore-discounts/main/rss/mo.xml) |
| `tw` | Taiwan, China | [RSS](https://raw.githubusercontent.com/appstore-discounts/appstore-discounts/main/rss/tw.xml) |
| `us` | United States | [RSS](https://raw.githubusercontent.com/appstore-discounts/appstore-discounts/main/rss/us.xml) |
| `tr` | Türkiye | [RSS](https://raw.githubusercontent.com/appstore-discounts/appstore-discounts/main/rss/tr.xml) |
| `pt` | Portugal | [RSS](https://raw.githubusercontent.com/appstore-discounts/appstore-discounts/main/rss/pt.xml) |

### Telegram

[![telegram](https://img.shields.io/badge/Telegram-Channel-blue?style=flat&logo=telegram "telegram")](https://t.me/appstore_discounts "telegram-channel")

### DingTalk

[![dingtalk](https://img.alicdn.com/imgextra/i3/O1CN01WMvMRG1ks3Ixc9x1v_!!6000000004738-55-tps-32-32.svg "dingtalk")](https://qr.dingtalk.com/action/joingroup?code=v1,k1,o9TXTPxGRNhCmrTUa4cHymeJCIcRiimCsH4FqEnbEWU=&_dt_no_comment=1&origin=11 "dingtalk")

## How It Works

```mermaid
flowchart LR
  A["Fetch ranked paid apps"] --> B["Refresh tracked app list"]
  B --> C["Read current app and IAP prices"]
  C --> D["Compare with stored history"]
  D --> E["Generate discount updates"]
  E --> F["Publish RSS"]
  E --> G["Send Telegram notifications"]
  E --> H["Send DingTalk notifications"]
```

The workflow runs every `120` minutes:

1. Fetch app information from paid rankings.
2. Refresh the tracked app list.
3. Read the latest app and in-app purchase prices.
4. Compare them with stored history.
5. Generate discount updates.
6. Refresh RSS files and send Telegram / DingTalk notifications.
7. Update related project documents and commit the changes.

Subscribers only receive a push when a tracked app is discounted.

## Related Documents

- [Currently tracked countries, regions, and apps](https://github.com/appstore-discounts/appstore-discounts/blob/main/docs/dist/FOCUS.md)
- [How to contribute](https://github.com/appstore-discounts/appstore-discounts/blob/main/docs/dist/CONTRIBUTION_GUIDELINES.md)

## Star History

<a href="https://star-history.com/#eyelly-wu/appstore-discounts&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=eyelly-wu/appstore-discounts&type=Date&theme=dark"></source><source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=eyelly-wu/appstore-discounts&type=Date"></source><img alt="Star History Chart" src="https://api.star-history.com/svg?repos=eyelly-wu/appstore-discounts&type=Date" />
  </picture>
</a>

## License

[MIT](./LICENSE)

Copyright (c) 2024-present Eyelly Wu
