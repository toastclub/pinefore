# 2024

## August

- 11th-???: Various changes to CRON; Queues; RSS; and Archives.
- 10th: Root domain filtering
- 4th-14th: Huge internal migration began. The backend and frontend used to be deployed together, but now they are separate, with their own `package.json`. This should help security and should make control much easier due to less bundling.
- 4th, 5th: OG image generation
- 3rd: Toasts for error messages
- 1st-3rd: Bugfixes

## July

- 31st: Show pins on tag pages
- 21st-30th: Begin RSS, Archive, and Queues support
- 19th: Bugfixes
- 17th
  - [Pinery] Expose part of Pinery SQL as generic for reuse
  - Toasts for already existing pins
- 16th
  - AI experiment for mastodon and twitter posts
  - Fix bug that caused submission to fail ([#6](https://github.com/toastclub/pinefore/issues/6))
  - Fix skeleton loader
  - Log errors to baselime
- 15th
  - Tag network API (get related tags)
  - Domain API (get entities on domain)
  - BIMI support for emails (no pfp because certs cost 1k)
- 14th
  - RGB 👀
  - GET other users

🏝️ Vacation 🏝️

- 3rd
  - JSON importer
- 2nd
  - Perf improvements
  - Fix bug in password validation
- 1st
  - Pin edit functionality on frontend
  - Skeleton loader for pins, currently still disabled
  - Filter aware title generation for pin page

## June

- Pin CRUD
  - 30th
    - Pin editing and deletion on frontend
    - **API Breaking change**: `/pins` returns url under `entity` instead of the top level
    - Contact page inside docs
    - Tag recommendation API, and support on the frontend
    - Finish pin CRUD
  - 29th
    - PUTing to update pin
  - 28th
    - Code quality improvements
    - Pin creation API. Its always been possible using the pinboard compatibility, but we want to offer modern APIs for CRUD
- Softening edges
  - 27th
    - Add ungenerated OG images as placeholders
  - 26th
    - Add indexes to database
    - Filtering by tags and date in sidebar
    - Text search in sidebar
  - 24th
    - Navigation sidebar for documentation page
- 23rd
  - Fix documentation. _When docs were open source, the symlink in the codebase caused the bundler to recognize the file, but not read the contents_
  - "Query engine", a way to construct where clauses in URLs, to be used in pins
- 22nd
  - Preregistration
- 20th
  - Try visual pins — images for pins of content that is mostly media
- 19th
  - Switch from `pg` to Postgres.js
  - Media Proxy
  - Referral suport on frontend
  - Get IP of user
- 17th
  - SES based emailing
- 15th
  - Importer for netscape style HTML
  - License page
  - Wobbly import button
- Login / Sessions / Graveyard
  - 14th
    - Login form
  - 11th
    - Graveyard support
    - Captcha for login
  - 9th
    - Cute IDs
    - CommonSchema
  - 7th
    - Update Password / Reset
  - 6th
    - User session management
  - 3rd
    - Login upsell
- Pinboard
  - 2nd
    - Pinboard auth

## May

- Pinboard
  - 28-30: Pinboard
- 23rd
  - API Docs
- 20th
  - Initial auth
- 19th
  - Initial payments
- 18th
  - Backend title fetch/parsing
- 16th
  - Login page
