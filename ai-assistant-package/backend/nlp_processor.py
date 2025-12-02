import re
from typing import Tuple, Dict

class NLPProcessor:
    """Natural Language Processing for power grid queries with fuzzy matching"""
    
    def __init__(self):
        # Power grid domain keywords for validation
        self.domain_keywords = [
            'power', 'grid', 'electric', 'electricity', 'transmission', 'voltage',
            'project', 'substation', 'hvdc', 'ministry', 'energy', 'cost',
            'region', 'state', 'duration', 'timeline', 'delay', 'budget',
            'kv', 'crore', 'overrun', 'regulatory', 'database', 'data'
        ]
        
        # Common typos mapping for fuzzy matching
        self.typo_corrections = {
            'hightest': 'highest', 'higest': 'highest', 'highst': 'highest',
            'hieghest': 'highest', 'heighest': 'highest', 'higgest': 'highest',
            'lowets': 'lowest', 'lowst': 'lowest', 'lowesr': 'lowest',
            'proect': 'project', 'porject': 'project', 'projct': 'project',
            'cosr': 'cost', 'cots': 'cost', 'costt': 'cost',
            'databse': 'database', 'datbase': 'database',
            'accordig': 'according', 'accoring': 'according',
            'transmision': 'transmission', 'transmisson': 'transmission',
            'expesive': 'expensive', 'expnsive': 'expensive',
        }
        
        # Define intent patterns
        self.intent_patterns = {
            'greeting': [
                r'\b(hello|hi|hey|greetings|good morning|good afternoon)\b',
            ],
            'project_count': [
                r'\bhow many\b.*\bproject',
                r'\bcount\b.*\bproject',
                r'\bnumber of project',
                r'\btotal project',
            ],
            'cost_analysis': [
                r'\bcost\b.*\banalysis',
                r'\bexpense',
                r'\bbudget',
                r'\bspending',
                r'\bhow much.*cost',
                r'\bcost overrun',
            ],
            'timeline_query': [
                r'\btimeline',
                r'\bduration',
                r'\bdelay',
                r'\bhow long',
                r'\bcompletion time',
                r'\bschedule',
            ],
            'region_query': [
                r'\bregion',
                r'\bstate',
                r'\b(madhya pradesh|uttar pradesh|rajasthan|bihar|maharashtra|gujarat|tamil nadu|karnataka|kerala|punjab|haryana|jharkhand)\b',
            ],
            'project_details': [
                r'\bdetails of',
                r'\bshow me project',
                r'\bproject information',
                r'\btell me about project',
            ],
            'voltage_level': [
                r'\b(765|400|220|132)\s*kv',
                r'\bvoltage level',
                r'\bhvdc',
            ],
            'cost_overrun': [
                r'\bcost overrun',
                r'\bover budget',
                r'\bexceeded.*cost',
            ],
            'highest_cost': [
                r'\b(highest|higest|highst|hightest|hieghest|maximum|max|most expensive|largest|biggest|top|expensive).*\b(cost|price|budget|expense|project)',
                r'\b(cost|price|budget|expense|project).*\b(highest|higest|highst|hightest|hieghest|maximum|max|most|largest|biggest|top|expensive)',
                r'\bmost.*cost',
                r'\bmax.*cost',
                r'\bexpensive.*project',
                r'\bcostly.*project',
                r'\b(highest|higest|highst|hightest).*\b(done|completed|according|database)',
            ],
            'lowest_cost': [
                r'\b(lowest|minimum|cheapest|smallest|least).*\b(cost|price|budget)',
                r'\b(cost|price|budget).*\b(lowest|minimum|cheapest|smallest|least)',
                r'\bleast.*cost',
                r'\bmin.*cost',
            ],
        }
        
        # Define entity extraction patterns
        self.entity_patterns = {
            'region': r'\b(Madhya Pradesh|Uttar Pradesh|Rajasthan|Bihar|Maharashtra|Gujarat|Tamil Nadu|Karnataka|Kerala|Punjab|Haryana|Jharkhand|Telangana|Mizoram|Nagaland|Himachal Pradesh|Jammu & Kashmir|Southern Region|Northern Region)\b',
            'voltage_level': r'\b(765|400|220|132)\s*kV',
            'project_type': r'\b(Transmission Line|Transmission System|HVDC|Substation|Communication System|Green Hydrogen|CSR|Smart Metering|Joint Venture)\b',
            'year': r'\b(20\d{2})\b',
        }
    
    def is_power_grid_domain(self, message: str) -> bool:
        """Check if message is related to power grid domain"""
        message_lower = message.lower()
        return any(keyword in message_lower for keyword in self.domain_keywords)
    
    def is_followup_question(self, message: str) -> bool:
        """Check if message is a follow-up question"""
        followup_patterns = [
            r'\b(this|that|it|its|the)\s+(project|one)',
            r'\b(what|which|tell me|show me)\s+(about|more)',
            r'\b(problems?|issues?|challenges?|delays?)\s+(during|in|with)',
            r'\b(why|how|when)\s+',
            r'^(and|also|additionally)',
            r'\b(other|similar|like|same)\s+(projects?|ones?)',
            r'\b(any|other|more)\s+(projects?|ones?)',
            r'\b(compare|comparison|similar)',
        ]
        message_lower = message.lower()
        return any(re.search(pattern, message_lower) for pattern in followup_patterns)
    
    def correct_typos(self, message: str) -> str:
        """Correct common typos in the message"""
        words = message.lower().split()
        corrected_words = []
        for word in words:
            clean_word = re.sub(r'[^\w]', '', word)
            if clean_word in self.typo_corrections:
                corrected_words.append(self.typo_corrections[clean_word])
            else:
                corrected_words.append(word)
        return ' '.join(corrected_words)
    
    def process_message(self, message: str, context: Dict = None) -> Tuple[str, Dict]:
        """Process user message and extract intent and entities with context"""
        corrected_message = self.correct_typos(message)
        message_lower = corrected_message.lower()
        
        if context is None:
            context = {}
        
        is_followup = self.is_followup_question(message)
        intent = self.detect_intent(message_lower)
        entities = self.extract_entities(message)
        
        # Handle follow-up questions about last project
        if is_followup and context.get('last_project'):
            if 'region' not in entities and context.get('last_entities', {}).get('region'):
                entities['region'] = context['last_entities']['region']
            
            entities['context_project'] = context['last_project']
            entities['is_followup'] = True
            
            if re.search(r'\b(problems?|issues?|challenges?|delays?)', message_lower):
                intent = 'project_problems'
            elif re.search(r'\b(timeline|duration|schedule)', message_lower):
                intent = 'project_timeline'
            elif re.search(r'\b(cost|budget|expense)', message_lower):
                intent = 'project_cost_detail'
            elif re.search(r'\b(other|similar|like|same|compare|comparison)\b.*\b(projects?|ones?)', message_lower):
                intent = 'similar_projects'
                if 'Voltage_Level_kV' in context.get('last_project', {}):
                    entities['voltage_level'] = f"{context['last_project']['Voltage_Level_kV']}kV"
                if 'Regulatory_Hotspot_Region' in context.get('last_project', {}):
                    entities['region'] = context['last_project']['Regulatory_Hotspot_Region']
        
        entities['is_domain_valid'] = self.is_power_grid_domain(message)
        return intent, entities
    
    def detect_intent(self, message: str) -> str:
        """Detect user intent from message"""
        for intent, patterns in self.intent_patterns.items():
            for pattern in patterns:
                if re.search(pattern, message, re.IGNORECASE):
                    return intent
        return 'general_query'
    
    def extract_entities(self, message: str) -> Dict:
        """Extract entities from message"""
        entities = {}
        for entity_type, pattern in self.entity_patterns.items():
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                entities[entity_type] = match.group(1) if match.lastindex else match.group(0)
        return entities
