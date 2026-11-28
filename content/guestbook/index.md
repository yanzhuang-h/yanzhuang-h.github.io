---
title: 访客簿
layout: profile-page
type: guestbook
comments: false
---

<article class="profile-sheet" aria-labelledby="guestbook-title">
<a href="/about/" class="back with-back">← 关于我</a>
<h1 id="guestbook-title">访客簿</h1>
<p class="opening">最近有什么小事，让你也想留下些什么？</p>
<section class="section" aria-labelledby="guestbook-letters">
  <h2 id="guestbook-letters">来信</h2>
  <p>你可以<a href="mailto:zoney_hu@163.com?subject=La%20Porte%20%C3%89troite%20%E8%AE%BF%E5%AE%A2%E6%9D%A5%E4%BF%A1">给我写封邮件</a>，也可以去我的<a href="https://v.douyin.com/9YUitwHwPFQ/">抖音</a>或<a href="https://xhslink.cn/o/9QaJvofksv">小红书</a>主页，发条私信给我。</p>
  <p>如果愿意把这段话留在访客簿里，请告诉我。你也可以留下喜欢的署名、所在的城市，或是带你来这里的那篇文字。</p>
</section>
<section id="visit-summary" class="section" aria-labelledby="visit-heading" hidden>
  <div class="section-heading">
    <h2 id="visit-heading">近期来访</h2>
    <div class="visit-ranges" role="group" aria-label="统计时段">
      <button type="button" data-visit-days="7" aria-pressed="false">近 7 天</button>
      <button type="button" data-visit-days="30" aria-pressed="true">近 30 天</button>
    </div>
  </div>
  <p id="visit-total" aria-live="polite" aria-atomic="true"></p>
  <div id="visit-breakdown" hidden>
    <figure class="visit-chart">
      <div id="visit-bars" aria-hidden="true"></div>
      <div id="visit-axis" class="quiet" aria-hidden="true"></div>
      <figcaption id="visit-since"></figcaption>
    </figure>
    <details><summary>逐日浏览次数</summary>
      <table class="visit-table"><thead><tr><th scope="col">日期</th><th scope="col">浏览次数</th></tr></thead><tbody id="visit-rows"></tbody></table>
    </details>
    <div id="visit-geography" hidden>
      <h3>来自哪些地区</h3>
      <p class="quiet">按网络出口所在的国家或地区汇总。</p>
      <ul id="visit-regions"></ul>
    </div>
  </div>
</section>
<details id="visit-preferences">
  <summary>统计偏好</summary>
  <label><input id="exclude-visits" type="checkbox" aria-describedby="visit-preference-status" disabled>不计入此浏览器的访问</label>
  <p class="quiet" id="visit-preference-status" role="status"></p>
</details>
</article>

<script defer src="/js/guestbook.js"></script>
