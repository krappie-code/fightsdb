// UFC Stats Scraper - Proof of Concept
// Scrapes data from ufcstats.com to validate data availability

import * as cheerio from 'cheerio'
import { UFCEventData, UFCFighterData, UFCFightData } from '@/types/database'

const UFC_STATS_BASE_URL = 'http://ufcstats.com'

// Rate limiting helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export class UFCStatsScraper {
  private async fetchPage(url: string): Promise<string> {
    // Respectful rate limiting - 1 second between requests
    await delay(1000)
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'FightsDB-Research-Bot/1.0 (Educational MMA Database Project)'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return await response.text()
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error)
      throw error
    }
  }

  async getRecentEvents(limit: number = 10): Promise<UFCEventData[]> {
    console.log('🔍 Scraping recent UFC events...')
    
    try {
      const html = await this.fetchPage(`${UFC_STATS_BASE_URL}/statistics/events/completed?page=all`)
      const $ = cheerio.load(html)
      
      const events: UFCEventData[] = []
      
      // Find event table rows
      $('.b-statistics__table tbody tr').slice(0, limit).each((i, row) => {
        const $row = $(row)
        const eventLink = $row.find('.b-link.b-link_style_black').first()
        const eventName = eventLink.text().trim()
        const eventId = eventLink.attr('href')?.split('/').pop() || ''
        
        const dateText = $row.find('td').eq(1).text().trim()
        const location = $row.find('td').eq(2).text().trim()
        
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
      
    } catch (error) {
      console.error('❌ Failed to scrape events:', error)
      throw error
    }
  }

  async getEventFights(eventId: string): Promise<UFCFightData[]> {
    console.log(`🥊 Scraping fights for event ${eventId}...`)
    
    try {
      const html = await this.fetchPage(`${UFC_STATS_BASE_URL}/event-details/${eventId}`)
      const $ = cheerio.load(html)
      
      const fights: UFCFightData[] = []
      
      // Find fight table rows
      $('.b-fight-details__table tbody tr').each((i, row) => {
        const $row = $(row)
        const $cells = $row.find('td')
        
        if ($cells.length >= 7) {
          const fighter1 = $cells.eq(1).find('a').first().text().trim()
          const fighter2 = $cells.eq(1).find('a').last().text().trim()
          const result = $cells.eq(0).text().trim()
          const weightClass = $cells.eq(6).text().trim()
          const method = $cells.eq(7).text().trim()
          const round = $cells.eq(8).text().trim()
          const time = $cells.eq(9).text().trim()
          
          const fightLink = $cells.eq(1).find('a').attr('href')
          const fightId = fightLink?.split('/').pop() || `${eventId}-${i}`
          
          fights.push({
            fight_id: fightId,
            event_id: eventId,
            fighter_1: fighter1,
            fighter_2: fighter2,
            result: result,
            method: method,
            round: round,
            time: time,
            weight_class: weightClass,
            title_fight: method.toLowerCase().includes('title')
          })
        }
      })
      
      console.log(`✅ Found ${fights.length} fights for event`)
      return fights
      
    } catch (error) {
      console.error(`❌ Failed to scrape fights for event ${eventId}:`, error)
      throw error
    }
  }

  async getFighterProfile(fighterName: string): Promise<UFCFighterData | null> {
    console.log(`👤 Looking up fighter: ${fighterName}`)
    
    // This is a simplified version - in production we'd implement fighter search
    // For now, return mock data to test the data pipeline
    
    const mockFighter: UFCFighterData = {
      fighter_id: `fighter-${fighterName.toLowerCase().replace(/\s+/g, '-')}`,
      first_name: fighterName.split(' ')[0] || '',
      last_name: fighterName.split(' ').slice(1).join(' ') || '',
      nickname: '',
      height: '6\' 0\"',
      weight: '185 lbs',
      reach: '74\"',
      stance: 'Orthodox',
      wins: '20',
      losses: '5',
      draws: '0',
      dob: 'Jan 01, 1990'
    }
    
    console.log(`✅ Fighter profile created: ${fighterName}`)
    return mockFighter
  }

  // Test the scraper with a specific recent event
  async testScraper(): Promise<{events: UFCEventData[], fights: UFCFightData[]}> {
    console.log('🧪 Testing UFC Stats scraper...')
    
    try {
      // Get recent events
      const events = await this.getRecentEvents(3)
      
      // Get fights for the most recent event
      const fights = events.length > 0 
        ? await this.getEventFights(events[0].event_id)
        : []
      
      console.log('✅ Scraper test complete!')
      console.log(`📊 Results: ${events.length} events, ${fights.length} fights`)
      
      return { events, fights }
      
    } catch (error) {
      console.error('❌ Scraper test failed:', error)
      throw error
    }
  }
}

// Export singleton instance
export const ufcScraper = new UFCStatsScraper()