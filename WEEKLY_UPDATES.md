# Weekly UFC Data Update Process

## Automation Schedule
**Every Sunday at 6 PM UTC** - Check for recent UFC events and update quiz questions

## Process Checklist
1. **Check Recent Events**
   - Visit https://www.ufc.com/events/results
   - Look for events from the past 7 days
   - Note main card fights and results

2. **Update Quiz Database**
   - Add new fights to `src/lib/quiz/questionGenerator.ts`
   - Include: fighter names, event name, date, location, result, method
   - Focus on title fights and popular fighters for easy questions

3. **Question Types to Add**
   - **Easy**: "Who won X vs Y at UFC Event?"
   - **Medium**: "How did X defeat Y?" / "At which event did X vs Y happen?"
   - **Hard**: "In what year/city did X vs Y take place?"

4. **Deploy Updates**
   - Commit changes with message: "feat: add UFC events from [date range]"
   - Push to trigger Vercel deployment
   - Verify quiz loads with new questions

## Recent Updates Log
- **April 5, 2026**: Added UFC Fight Night: Adesanya vs. Pyfer (Mar 28)
- **April 5, 2026**: Added UFC 326: Holloway vs. Oliveira 2 (Mar 7)
- **April 5, 2026**: Added UFC Fight Night: Evloev vs. Murphy (Mar 21)

## Upcoming Events to Watch
- **April 4, 2026**: UFC Fight Night: Moicano vs. Duncan (Las Vegas)
- **April 11, 2026**: UFC 327: Prochazka vs. Ulberg (Miami)

## Automation Ideas
- Set OpenClaw cron job: `0 18 * * 0` (Sundays 6 PM UTC)
- Could integrate with UFC RSS feeds for automatic detection
- Future: Web scraping automation for fight results