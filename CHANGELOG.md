# 2024

## September

- 10th:
  - Finish tag editing
  - → 15th: Note support in API
  - Feed updating in API
- 9th:
  - Continued support for profiles
  - Fix issue with client error for logged out users
- 8th
  - Beginning profile support
    - PFPs
    - Descriptions
  - Beginning tag editing
  - Fix for the previous two issues
- While we’ve had a functioning feed backend for a week, the first OPML import was completed successfully on the 6th. This exposed a number of issues
  - Minor: a great deal of issues in our feed parser have been identified
  - Major: on conflict do nothing increments entity primary keys, which resulted in breakneck increments (at a rate of about 100k per hour). A script was created to collapse these gaps, and for the runtime of the script (some ~2s), information was potentially lost. A patch has not yet been created, so RSS fetching has been disabled
- 6th: OPML importing
- 5th: Fix login bug where captcha was consumed and not regenerated
- View transitions
- Continued support for feeds
  - Send new items to queue right away
  - Viewing them on frontend
  - Queues now work 

## August

August flew by under the radar. Most of the work done was to set ourselves up for success in the future. We added strong testing frameworks, and subdivided our code. In addition, RSS is now supported on the backend. There have been no frontend changes, due to a long standing bug in the development environment. The project initially was in a rapid back-and-forth state where changes could be seen happening daily, but now I prefer to focus on one at a time.

- 23rd-30th: Begin feeds on the frontend; stripe support
  - Feeds are coming along nicely, the API works quite well and only minor issues have been identified
  - Stripe blocked by em_8mhgm6zkdyx8sh5wpbxayxkbatdk0w
- 21st: Embeddings for reccomendations
- 18th-19th: Integration test framework; many integration & unit tests (~15% coverage)
- 11th-???: Various changes to CRON; Queues; RSS; and Archives.
- 10th: Root domain filtering
- 4th-14th: Huge internal migration began. The backend and frontend used to be deployed together, but now they are separate, with their own `package.json`. This should help security and should make control much easier due to less bundling.
- 4th, 5th: OG image generation
- 3rd: Toasts for error messages
- 1st-3rd: Bugfixes

## July

July did some quality of life improvements, and began to scaffold out our next steps.

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

June was a highly productive month, with a lot of features being added — the service began to take shape. At the beginning, the focus was on a lot of chores, like session management, mailing and captchas. The query engine was introduced, and overall the service became a usable MVP.

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

In May, the vision just was beginning. An initial backend was created, and the frontend was being built.

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
