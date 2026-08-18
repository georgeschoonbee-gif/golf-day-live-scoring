# Golf Day Live Scoring

First working browser version of the golf-day scoring app.

## Admin password

`Admin!`

## Included

- 2–18 teams
- 4 players per team
- Player names and official handicaps
- Adjustable handicap allowance %
- Course Library with course name + 18 holes
- Par and Stroke Index per hole
- Multiple scoring formats
- Gross-score entry
- Stableford/IPS calculation
- Drive-used tracking
- Leaderboard
- Local browser saving

## Important limitation of this version

This version saves data in the browser using localStorage. It is excellent for testing the workflow, but it is NOT yet true multi-phone live scoring.

The next version should connect to Supabase (or another shared online database) so all teams can score from different phones and see one live leaderboard.

## Run locally

Open `index.html` in a browser.

For GitHub Pages, upload the three files in this folder to a repository and enable GitHub Pages.
