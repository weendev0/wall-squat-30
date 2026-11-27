# 30 Days Challenges

A free Progressive Web App (PWA) for 30-day challenges that run side by side: a timed wall squat, plus Reading, Course and Study check-offs with a daily note.
It is built with Angular 21, hosted on GitHub Pages and keeps all data on your phone.

## Install it on your iPhone

The app lives at **https://weendev0.github.io/wall-squat-30/**. Every merge to `main` publishes a new version there.

1. Open the address in **Safari** on the iPhone.
2. Tap the **Share** button, then **Add to Home Screen**, then **Add**.
3. Open it from the new Home Screen icon. It works offline from then on.

Keep in mind:

- Your data is stored on the phone, inside this Home Screen app. **Deleting the icon deletes the data**, so use CSV export as your backup.
- The address must never change, because the data belongs to it.
- Updates arrive by themselves: close and reopen the app after a new version is published.

## Run it on your computer

You need [Node.js 22 LTS](https://nodejs.org) and Git. No Mac or Xcode is needed.

```bash
npm install          # install packages (first time only)
npm start            # open http://localhost:4200
npm test             # run the tests and keep watching for changes
npm run test:ci      # run the tests once, with a coverage report
npm run build        # production build in dist/
npm run build:pages  # the GitHub Pages build (served from /wall-squat-30/)
```

## How the code is organised

The app follows clean architecture: the business rules know nothing about Angular or the browser.

| Folder                   | What lives there                                                                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `src/app/domain`         | The challenge rules (BR-01 to BR-12 in the spec), as plain TypeScript functions with unit tests next to each file |
| `src/app/application`    | Use cases such as `RecordAttemptUseCase`, and the interfaces (ports) they need: repositories, clock, id generator |
| `src/app/infrastructure` | IndexedDB storage through Dexie, the system clock, id generator, Web Audio beeps and the screen wake lock         |
| `src/app/composition`    | The one place that connects each port to its real class, for Angular dependency injection                         |
| `src/app/presentation`   | Angular screens, the signal stores they read from, and the route guards                                           |

Every rule function has a comment with the rule ID it implements, for example `BR-06` for the streak.

## Keeping data through updates

Data lives in IndexedDB on the phone, in the database defined in
`src/app/infrastructure/persistence/wall-squat-database.ts`. Never edit an existing
`version(n)` block there: add a new version with an upgrade step and a test.

## App icon

The icons in `public/icons` are drawn by `tools/make-icons.py` (Python with Pillow). Change the
colours there and run `python3 tools/make-icons.py` to redraw every size.
