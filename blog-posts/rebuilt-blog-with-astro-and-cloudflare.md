---
title: 'ブログをCloudflare Pages + Astroに載せ替えました'
createdAt: '2023-10-07'
---

仕事でNode.jsを触っていて、その流れでSSRやSSGといった文脈にも興味を持つようになり、その中でも最近よく話題になっているのを見かけるAstroとCloudflareにブログを載せ替えてみました。

## Astro

<https://astro.build/>

触る前は `.astro` という独自の拡張子のファイルでページやコンポーネントを記述しなくてはいけない点がどうかなと思ってたんですが、いざ書いてみると書き方は直感的だなと思いましたし、VSCodeのAstro拡張も用意されていて補完も効くし、体験良かったです。

## Cloudflare Pages

<https://pages.cloudflare.com/>

プレビューも簡単、デプロイも非常に高速かつスムーズで、触り始めて小一時間程度でGitHub Pagesからの移行をCI/CDの仕組みも含め完了できました。
現状はSSGした静的サイトを公開しているだけですが、今後Cloudflare Workersをうまく使ってZennのリンクカードみたいな機能（外部サイトのOGP取得＆ブログ記事内に埋め込み）とか作ってみたいなと思っています。

## 余談

そろそろブログ記事よりもブログのフレームワーク入れ替えた回数の方が多い説が出てきました。
