"""
Web Search Integration for Power Grid Knowledge
Uses DuckDuckGo HTML for web search (no API key needed)
"""

import requests
from bs4 import BeautifulSoup
from typing import List, Dict
import re
import urllib.parse

class WebSearchHandler:
    """Handle web searches for power grid related information"""
    
    def __init__(self):
        self.search_enabled = True
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        }
    
    def is_power_grid_query(self, query: str) -> bool:
        """Check if query is about general power grid knowledge (not in database)"""
        query_lower = query.lower()
        
        # First check if it's asking for DATABASE data (should NOT web search)
        database_keywords = [
            'highest cost', 'lowest cost', 'most expensive', 'cheapest',
            'delayed project', 'how many project', 'show project',
            'list project', 'project in', 'voltage', 'region',
            'problems', 'issues', 'similar project', 'cost overrun',
            'our project', 'database', 'your data'
        ]
        
        if any(keyword in query_lower for keyword in database_keywords):
            return False
        
        # Web search for GENERAL knowledge questions
        general_keywords = [
            'what is', 'explain', 'define', 'how does', 'why',
            'latest', 'recent', 'news', 'policy', 'ministry',
            'regulation', 'standard', 'technology', 'difference',
            'meaning', 'tell me about', 'describe', 'advantages',
            'disadvantages', 'benefits', 'future', 'trend'
        ]
        
        return any(keyword in query_lower for keyword in general_keywords)
    
    def search_duckduckgo(self, query: str, max_results: int = 3) -> List[Dict]:
        """Search DuckDuckGo HTML version for power grid information"""
        try:
            search_query = f"{query} power grid electricity india"
            encoded_query = urllib.parse.quote_plus(search_query)
            url = f"https://html.duckduckgo.com/html/?q={encoded_query}"
            
            response = requests.get(url, headers=self.headers, timeout=10)
            
            if response.status_code != 200:
                print(f"DuckDuckGo returned status: {response.status_code}")
                return self._get_fallback_results(query)
            
            soup = BeautifulSoup(response.text, 'html.parser')
            results = []
            result_divs = soup.find_all('div', class_='result')
            
            for result in result_divs[:max_results]:
                try:
                    title_elem = result.find('a', class_='result__a')
                    if not title_elem:
                        continue
                    
                    title = title_elem.get_text(strip=True)
                    link = title_elem.get('href', '')
                    
                    snippet_elem = result.find('a', class_='result__snippet')
                    snippet = snippet_elem.get_text(strip=True) if snippet_elem else ''
                    
                    if title and link:
                        results.append({
                            'title': title,
                            'url': link,
                            'snippet': snippet[:250] if snippet else 'No description available'
                        })
                except Exception as e:
                    continue
            
            if not results:
                return self._get_fallback_results(query)
                
            return results
            
        except requests.exceptions.Timeout:
            print("Web search timed out")
            return self._get_fallback_results(query)
        except Exception as e:
            print(f"Web search error: {e}")
            return self._get_fallback_results(query)
    
    def _get_fallback_results(self, query: str) -> List[Dict]:
        """Provide fallback knowledge when web search fails"""
        query_lower = query.lower()
        
        # Built-in knowledge base for common power grid topics
        knowledge_base = {
            'smart grid': {
                'title': 'Smart Grid Technology',
                'snippet': 'A smart grid is an electrical grid that uses digital technology, sensors, and software to monitor and manage electricity flow. It enables two-way communication between utilities and consumers, improves efficiency, reduces losses, and integrates renewable energy sources like solar and wind power.',
                'url': 'https://en.wikipedia.org/wiki/Smart_grid'
            },
            'hvdc': {
                'title': 'High Voltage Direct Current (HVDC)',
                'snippet': 'HVDC is a technology for transmitting electrical power over long distances using direct current. It is more efficient than AC for distances over 600km. India uses 800kV HVDC for projects like the Champa-Kurukshetra and Raigarh-Pugalur lines.',
                'url': 'https://en.wikipedia.org/wiki/High-voltage_direct_current'
            },
            'transmission': {
                'title': 'Power Transmission in India',
                'snippet': 'India has one of the largest power transmission networks in the world, operated by Power Grid Corporation of India Limited (PGCIL). The network includes 765kV, 400kV, and 220kV transmission lines spanning over 170,000 circuit kilometers.',
                'url': 'https://www.powergrid.in'
            },
            'renewable': {
                'title': 'Renewable Energy Integration',
                'snippet': 'India aims to achieve 500 GW of renewable energy capacity by 2030. The power grid is being upgraded with Green Energy Corridors to handle variable renewable sources like solar and wind power through grid balancing and battery storage solutions.',
                'url': 'https://mnre.gov.in'
            },
            'transformer': {
                'title': 'Power Transformers',
                'snippet': 'Power transformers are essential components that step up or step down voltage levels for efficient transmission and distribution. High-voltage transformers (400kV, 765kV) are critical in transmission networks for reducing power losses.',
                'url': 'https://en.wikipedia.org/wiki/Transformer'
            },
            'substation': {
                'title': 'Electrical Substations',
                'snippet': 'Substations transform voltage levels, switch circuits, and protect the grid. Types include transmission substations (765kV/400kV), distribution substations (33kV/11kV), and Gas Insulated Substations (GIS) for urban areas.',
                'url': 'https://en.wikipedia.org/wiki/Electrical_substation'
            },
            'power grid': {
                'title': 'Indian Power Grid',
                'snippet': 'The Indian power grid is divided into 5 regional grids (Northern, Southern, Eastern, Western, North-Eastern) interconnected through HVDC and AC links forming ONE NATION ONE GRID. PGCIL operates over 170,000 circuit km of transmission lines.',
                'url': 'https://www.powergrid.in'
            },
            'ministry': {
                'title': 'Ministry of Power, India',
                'snippet': 'The Ministry of Power oversees electricity generation, transmission, and distribution in India. Key initiatives include UDAY scheme for DISCOM revival, Saubhagya for 100% electrification, PM-KUSUM for solar pumps, and Green Energy Corridor.',
                'url': 'https://powermin.gov.in'
            },
            '765': {
                'title': '765kV Transmission Lines',
                'snippet': '765kV is the highest AC voltage level used in India for bulk power transmission. These lines can carry up to 2000-2500 MW of power with lower losses. Major 765kV corridors connect power surplus regions to demand centers.',
                'url': 'https://www.powergrid.in'
            },
            'loss': {
                'title': 'Transmission & Distribution Losses',
                'snippet': 'India\'s T&D losses are around 15-20%, among the highest globally. Losses include technical losses (resistance, corona) and commercial losses (theft, metering errors). Smart meters and grid upgrades are reducing these losses.',
                'url': 'https://powermin.gov.in'
            },
            'solar': {
                'title': 'Solar Power in India',
                'snippet': 'India has installed over 70 GW of solar capacity as of 2024, targeting 280 GW by 2030. Major solar parks include Bhadla (2,245 MW), Pavagada (2,050 MW), and Kurnool (1,000 MW). Green Energy Corridors evacuate this power.',
                'url': 'https://mnre.gov.in'
            },
            'pgcil': {
                'title': 'Power Grid Corporation of India Limited',
                'snippet': 'PGCIL is a Maharatna PSU and the Central Transmission Utility (CTU) of India. It owns and operates the inter-state transmission system and has a market cap of over ₹2 lakh crores. It transmits about 50% of India\'s electricity.',
                'url': 'https://www.powergrid.in'
            }
        }
        
        # Find matching topic
        for keyword, info in knowledge_base.items():
            if keyword in query_lower:
                return [{
                    'title': info['title'],
                    'url': info['url'],
                    'snippet': info['snippet']
                }]
        
        # Default response
        return [{
            'title': 'Power Grid Information',
            'url': 'https://www.powergrid.in',
            'snippet': 'The Indian power grid is one of the largest synchronized grids in the world. For specific project data (costs, timelines, delays), I can search your database. For general information, visit the official Power Grid Corporation or Ministry of Power websites.'
        }]
    
    def get_web_answer(self, query: str) -> Dict:
        """Get answer from web search or knowledge base"""
        results = self.search_duckduckgo(query)
        
        if not results:
            return {
                'text': '🔍 I couldn\'t find web results, but your database has accurate project information. Try asking about specific projects, costs, or regions.',
                'sources': []
            }
        
        response_text = "🌐 **Here's what I found:**\n\n"
        
        for i, result in enumerate(results, 1):
            response_text += f"**{result['title']}**\n"
            response_text += f"{result['snippet']}\n"
            response_text += f"🔗 {result['url']}\n\n"
        
        response_text += "---\n💡 *For specific project data (costs, timelines, delays), ask me to check the database!*"
        
        return {
            'text': response_text,
            'sources': results
        }
