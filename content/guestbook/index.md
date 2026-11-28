---
title: 访客簿
layout: profile-page
type: guestbook
comments: false
---

<link rel="stylesheet" href="/css/guestbook-letters.css">
<article class="profile-sheet" aria-labelledby="guestbook-title">
<a href="/about/" class="back with-back">← 关于我</a>
<h1 id="guestbook-title">访客簿</h1>
<p class="opening">最近有什么小事，让你也想留下些什么？</p>
<section class="section" aria-labelledby="guestbook-letters">
  <h2 id="guestbook-letters">写留言</h2>
  <form id="guestbook-form" method="post" hidden>
    <fieldset>
      <legend class="letter-sr-only">写给呼庄严的留言</legend>
      <label for="letter-message">留言<span class="quiet">（最多 1000 字）</span></label>
      <textarea id="letter-message" name="message" rows="4" maxlength="1000" required></textarea>
      <label for="letter-signature">署名<span class="quiet">（选填）</span></label>
      <input id="letter-signature" name="signature" type="text" maxlength="40" autocomplete="off">
      <div class="letter-trap" aria-hidden="true"><label>请留空<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
      <p class="quiet" id="letter-privacy">默认只有我能看到这封留言。</p>
      <label class="letter-consent"><input type="checkbox" name="allowPublic" aria-describedby="letter-privacy">我同意审核后公开这段话和我的署名。</label>
      <button type="submit">寄出留言</button>
    </fieldset>
    <p id="letter-status" class="quiet" role="status" aria-live="polite" aria-atomic="true"></p>
  </form>
  <p>你可以<a href="mailto:zoney_hu@163.com?subject=La%20Porte%20%C3%89troite%20%E8%AE%BF%E5%AE%A2%E6%9D%A5%E4%BF%A1">给我写封邮件</a>，也可以在<a href="https://v.douyin.com/9YUitwHwPFQ/" data-app-profile="douyin">抖音</a>或<a href="https://xhslink.cn/o/9QaJvofksv" data-app-profile="xiaohongshu">小红书</a>给我发私信。</p>
  <p>如果愿意把来信留在这里，记得告诉我，再留一个你喜欢的署名。</p>
</section>
<section id="public-letters" class="section" aria-labelledby="public-letters-heading" hidden>
  <h2 id="public-letters-heading">公开留言</h2>
  <ol id="public-letters-list"></ol>
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
<script defer src="/js/guestbook-letters.js"></script>
