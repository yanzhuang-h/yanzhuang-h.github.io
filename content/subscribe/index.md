---
title: 订阅近况
layout: profile-page
type: subscribe
comments: false
---

<link rel="stylesheet" href="/css/subscribe.css">
<article class="profile-sheet newsletter" aria-labelledby="newsletter-title">
  <h1 id="newsletter-title">订阅近况</h1>
  <p class="opening">有值得分享的文章、视频或作品时，我会给你写封信。</p>
  <form class="newsletter-form" method="post" action="https://buttondown.com/api/emails/embed-subscribe/huzhuangyan">
    <fieldset>
      <legend>用邮箱订阅</legend>
      <label for="newsletter-email">邮箱地址</label>
      <div class="newsletter-fields">
        <input id="newsletter-email" type="email" name="email" autocomplete="email" inputmode="email" required aria-describedby="newsletter-details">
        <input type="hidden" name="embed" value="1">
        <button type="submit">订阅</button>
      </div>
    </fieldset>
    <p id="newsletter-details" class="quiet">邮件由 Buttondown 寄送。点开确认信即可订阅，每封来信都可以退订。</p>
  </form>
  <a class="detail-link" href="/atom.xml" type="application/atom+xml">用 RSS 阅读</a>
</article>
