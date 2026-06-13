---
title: 'I rebuilt my blog on Cloudflare Pages + Astro'
createdAt: '2023-10-07'
---

I've been working with Node.js at my job, and that got me interested in things like SSR and SSG. Along the way I kept seeing Astro and Cloudflare come up a lot lately, so I decided to rebuild my blog on top of them.

## Astro

<https://astro.build/>

Before trying it out, I was a bit skeptical about having to write pages and components in files with a custom `.astro` extension. But once I actually started writing them, I found the syntax pretty intuitive. There's also an Astro extension for VSCode that gives you completion, so the experience was great.

## Cloudflare Pages

<https://pages.cloudflare.com/>

Previews are easy, and deploys are very fast and smooth. Within about an hour of getting started, I had finished migrating off GitHub Pages, CI/CD setup and all. Right now I'm just publishing a static SSG site, but going forward I'd like to make good use of Cloudflare Workers to build something like Zenn's link cards (fetching OGP from external sites and embedding it in blog posts).

## Aside

I'm starting to suspect that the number of times I've swapped out my blog's framework now exceeds the number of blog posts I've written.
