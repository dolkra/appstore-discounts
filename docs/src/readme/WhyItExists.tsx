import React, { H1 } from 'jsx-to-md'

export default function WhyItExists() {
  return (
    <>
      <H1>{t('为什么会有这个项目')}</H1>
      {t(
        'App 价格经常变化，手动检查既繁琐也容易错过优惠。本项目会自动追踪付费榜单与已收录应用的价格变化，并通过订阅渠道推送折扣信息，帮助用户更及时地发现值得购买的应用。',
      )}
    </>
  )
}
