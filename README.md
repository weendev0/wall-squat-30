# Wall Squat Challenge 30 Days

A free Progressive Web App (PWA) that times your daily wall squat and tracks a 30-day challenge.
It is built with Angular 21, hosted on GitHub Pages and keeps all data on your phone.

## Run it on your computer

You need [Node.js 22 LTS](https://nodejs.org) and Git. No Mac or Xcode is needed.

```bash
npm install          # install packages (first time only)
npm start            # open http://localhost:4200
npm test             # run the tests and keep watching for changes
npm run test:ci      # run the tests once, with a coverage report
npm run build        # production build in dist/
```

## How the code is organised

The app follows clean architecture: the business rules know nothing about Angular or the browser.

| Folder | What lives there |
| --- | --- |
| `src/app/domain` | The challenge rules (BR-01 to BR-12 in the spec), as plain TypeScript functions with unit tests next to each file |
| `src/app/application` | Use cases such as "save attempt" and the interfaces (ports) they need *(next pull request)* |
| `src/app/infrastructure` | IndexedDB storage, sounds, screen wake lock *(coming)* |
| `src/app/presentation` | Angular screens *(coming)* |

Every rule function has a comment with the rule ID it implements, for example `BR-06` for the streak.
