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
- **April 30, 2026**: 🚨 FOUND MISSED EVENT! Added UFC Fight Night: Della Maddalene vs. Prates (Apr 28, Perth) - Full main card (5 fights)
- **April 26, 2026**: 🚨 FOUND MISSED EVENT! Added UFC Fight Night: Sterling vs. Zalal (Apr 25) - Full main card (6 fights)
- **April 26, 2026**: Checked for events Apr 21-26 - No new UFC events found to add
- **April 19, 2026**: Added UFC Fight Night: Burns vs. Malott (Apr 20) - Full main card (5 fights)
- **April 14, 2026**: Added UFC 327: Procházka vs. Ulberg (Apr 11) - Full main card
- **April 7, 2026**: Added UFC Fight Night: Moicano vs. Duncan (Apr 5)
- **April 5, 2026**: Added UFC Fight Night: Adesanya vs. Pyfer (Mar 28)
- **April 5, 2026**: Added UFC 326: Holloway vs. Oliveira 2 (Mar 7)
- **April 5, 2026**: Added UFC Fight Night: Evloev vs. Murphy (Mar 21)

## Current Events in Database
- **UFC Fight Night**: Della Maddalene vs. Prates (Apr 28, 2026, Perth) - 5 fights added
- **UFC Fight Night**: Sterling vs. Zalal (Apr 25, 2026) - 6 fights added
- **UFC Fight Night**: Burns vs. Malott (Apr 20, 2026) - 5 fights added
- **UFC 327**: Procházka vs. Ulberg (Apr 11, 2026) - 5 fights added
- **UFC Fight Night**: Moicano vs. Duncan (Apr 5, 2026)
- **UFC Fight Night**: Adesanya vs. Pyfer (Mar 28, 2026)
- **UFC Fight Night**: Evloev vs. Murphy (Mar 21, 2026)
- **UFC 326**: Holloway vs. Oliveira 2 (Mar 7, 2026)

**Total fights in database**: 35 fights across 8 recent events

## Upcoming Events to Watch
- Check weekly for new UFC announcements and completed events

## Automation Ideas
- Set OpenClaw cron job: `0 18 * * 0` (Sundays 6 PM UTC)
- Could integrate with UFC RSS feeds for automatic detection
- Future: Web scraping automation for fight results