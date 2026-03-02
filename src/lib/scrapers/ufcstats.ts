// UFC Stats Scraper
// Scrapes data from ufcstats.com

import * as cheerio from 'cheerio'
import { UFCEventData, UFCFighterData, UFCFightData } from '@/types/database'

const UFC_STATS_BASE_URL = 'http://ufcstats.com'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export class UFCStatsScraper {
  private async fetchPage(url: string): Promise<string> {
    await delay(1000)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FightsDB/1.0)'
      }
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    return await response.text()
  }

  async getRecentEvents(limit: number = 10): Promise<UFCEventData[]> {
    console.log('🔍 Scraping recent UFC events...')

    const html = await this.fetchPage(`${UFC_STATS_BASE_URL}/statistics/events/completed?page=all`)
    const $ = cheerio.load(html)

    const events: UFCEventData[] = []

    // Events are in table rows with links to event-details
    $('a.b-link.b-link_style_black').each((i, el) => {
      if (events.length >= limit) return false

      const $link = $(el)
      const href = $link.attr('href') || ''
      if (!href.includes('event-details')) return

      const eventName = $link.text().trim()
      const eventId = href.split('/').pop() || ''

      // Date and location are in the parent row
      const $row = $link.closest('tr')
      const $date = $row.find('.b-statistics__date')
      const dateText = $date.text().trim()

      // Location is in the second column span
      const $cols = $row.find('td')
      const location = $cols.length > 1 ? $cols.eq(1).text().trim() : ''

      if (eventName && eventId) {
        events.push({
          event_id: eventId,
          event_name: eventName,
          event_date: dateText,
          location: location
        })
      }
    })

    console.log(`✅ Found ${events.length} recent events`)
    return events
  }

  async getEventFights(eventId: string): Promise<UFCFightData[]> {
    console.log(`🥊 Scraping fights for event ${eventId}...`)

    const html = await this.fetchPage(`${UFC_STATS_BASE_URL}/event-details/${eventId}`)
    const $ = cheerio.load(html)

    const fights: UFCFightData[] = []

    // Each fight is a table row with class b-fight-details__table-row
    $('tr.b-fight-details__table-row').each((i, row) => {
      const $row = $(row)
      const $cols = $row.find('td')
      if ($cols.length < 2) return

      // First column has the result (W/L/D/NC)
      const result = $cols.eq(0).text().trim()

      // Fighter names are in the second column links
      const fighters: string[] = []
      $cols.eq(1).find('a').each((_, a) => {
        const name = $(a).text().trim()
        if (name) fighters.push(name)
      })

      if (fighters.length < 2) return

      // Get fight link for ID
      const fightLink = $row.attr('data-link') || $row.find('a').first().attr('href') || ''
      const fightId = fightLink.split('/').pop() || `${eventId}-${i}`

      // Weight class, method, round, time from remaining columns
      const weightClass = $cols.eq(6)?.text().trim() || ''
      const method = $cols.eq(7)?.text().trim() || ''
      const round = $cols.eq(8)?.text().trim() || ''
      const time = $cols.eq(9)?.text().trim() || ''

      fights.push({
        fight_id: fightId,
        event_id: eventId,
        fighter_1: fighters[0],
        fighter_2: fighters[1],
        result: result,
        method: method,
        round: round,
        time: time,
        weight_class: weightClass,
        title_fight: method.toLowerCase().includes('title')
      })
    })

    console.log(`✅ Found ${fights.length} fights for event`)
    return fights
  }

  async getFighterProfile(fighterName: string): Promise<UFCFighterData | null> {
    console.log(`👤 Looking up fighter: ${fighterName}`)
    return null // TODO: implement fighter detail scraping
  }

  async testScraper(): Promise<{events: UFCEventData[], fights: UFCFightData[]}> {
    console.log('🧪 Testing UFC Stats scraper...')
    const events = await this.getRecentEvents(3)
    const fights = events.length > 0
      ? await this.getEventFights(events[0].event_id)
      : []
    console.log(`📊 Results: ${events.length} events, ${fights.length} fights`)
    return { events, fights }
  }
}

export const ufcScraper = new UFCStatsScraper()
