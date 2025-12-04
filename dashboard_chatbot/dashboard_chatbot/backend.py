"""
Intelligent NLP-Powered Backend for Power Grid Analysis
Uses semantic understanding instead of regex patterns
Enhanced with Gemini AI for better query understanding
"""
import os
import pickle
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime
import google.generativeai as genai

app = FastAPI(title="PowerGrid AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

dataset = None
model = None
gemini_model = None
conversation_context = {
    "last_project_id": None,
    "last_query_type": None,
    "mentioned_projects": []
}

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyAYlm__RltTvODGDelP10-q25lZLX0WC_k")
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel('models/gemini-2.0-flash')
        print(f"[INFO] Gemini AI configured successfully")
    except Exception as e:
        print(f"[WARN] Gemini configuration failed: {e}")
        gemini_model = None
else:
    print(f"[WARN] No Gemini API key found")
    gemini_model = None

@app.on_event("startup")
async def load_resources():
    global dataset, model
    
    try:
        dataset_path = "Final_dataset.csv"
        if os.path.exists(dataset_path):
            dataset = pd.read_csv(dataset_path)
            print(f"[INFO] Dataset loaded: {len(dataset)} rows, {len(dataset.columns)} columns")
            print(f"[INFO] Columns: {', '.join(dataset.columns[:10].tolist())}")
        else:
            print(f"[WARN] Dataset not found at {dataset_path}")
        
        model_path = "powergrid_risk_model_package (1).pkl"
        if os.path.exists(model_path):
            with open(model_path, 'rb') as f:
                model = pickle.load(f)
            print(f"[INFO] Risk model loaded")
        else:
            print(f"[WARN] Model not found at {model_path}")
            
    except Exception as e:
        print(f"❌ Startup Error: {e}")

def extract_intent(message: str):
    """Extract user intent from natural language query"""
    msg_lower = message.lower()
    
    # Intent categories with semantic keywords
    intents = {
        "loss": ["loss", "lost", "lose", "overrun", "overspent", "extra cost", "exceeded", "over budget"],
        "cost_query": ["cost", "price", "expensive", "budget", "spend", "money", "rupee", "inr"],
        "highest": ["highest", "maximum", "most", "largest", "biggest", "top"],
        "lowest": ["lowest", "minimum", "least", "smallest", "cheapest"],
        "latest": ["latest", "newest", "most recent", "recent", "last", "new"],
        "oldest": ["oldest", "earliest", "first"],
        "average": ["average", "mean", "typical", "median"],
        "problem": ["problem", "issue", "challenge", "difficulty", "delay", "obstacle", "trouble"],
        "project_info": ["project", "details", "information", "about", "tell me"],
        "count": ["how many", "count", "number of", "total"],
        "compare": ["compare", "difference", "versus", "vs"],
        "timeline": ["timeline", "duration", "time", "days", "delay", "schedule"],
        "risk": ["risk", "assessment", "analyze", "evaluation"],
        "status": ["status", "state", "condition", "progress"],
        "list": ["list", "show", "display", "all"],
        "voltage": ["voltage", "kv", "transmission", "power"],
        "type": ["type", "category", "kind"],
        "location": ["location", "state", "region", "area", "where"],
        "date_filter": ["started", "during", "in", "jan", "january", "feb", "february", "mar", "march", "apr", "april", "may", "jun", "june", "jul", "july", "aug", "august", "sep", "september", "oct", "october", "nov", "november", "dec", "december", "2024", "2023", "2022"],
    }
    
    detected_intents = []
    for intent, keywords in intents.items():
        if any(keyword in msg_lower for keyword in keywords):
            detected_intents.append(intent)
    
    return detected_intents if detected_intents else ["general"]

def extract_date_filter(message: str):
    """Extract date/month/year filters from query"""
    import re
    msg_lower = message.lower()
    
    # Month name to number mapping
    months = {
        'jan': 1, 'january': 1,
        'feb': 2, 'february': 2,
        'mar': 3, 'march': 3,
        'apr': 4, 'april': 4,
        'may': 5,
        'jun': 6, 'june': 6,
        'jul': 7, 'july': 7,
        'aug': 8, 'august': 8,
        'sep': 9, 'september': 9,
        'oct': 10, 'october': 10,
        'nov': 11, 'november': 11,
        'dec': 12, 'december': 12
    }
    
    date_filter = {}
    
    # Extract year
    year_match = re.search(r'\b(20\d{2})\b', msg_lower)
    if year_match:
        date_filter['year'] = int(year_match.group(1))
    
    # Extract month
    for month_name, month_num in months.items():
        if month_name in msg_lower:
            date_filter['month'] = month_num
            date_filter['month_name'] = month_name.title()
            break
    
    # Check if query is about start date or end date
    if any(word in msg_lower for word in ['start', 'began', 'initiated', 'commenced']):
        date_filter['date_field'] = 'Project_Start_Date'
    elif any(word in msg_lower for word in ['end', 'complete', 'finish']):
        date_filter['date_field'] = 'Project_End_Date_Actual'
    else:
        # Default to start date if asking "during"
        if 'during' in msg_lower or 'in' in msg_lower:
            date_filter['date_field'] = 'Project_Start_Date'
    
    # Only return if we actually found a time period (year or month)
    if 'year' in date_filter or 'month' in date_filter:
        return date_filter
        
    return None

def analyze_query_with_gemini(message: str, dataset_columns: list):
    """Use Gemini to understand ANY power grid query and generate pandas code"""
    if not gemini_model:
        return None
    
    try:
        prompt = f"""You are a power grid data analyst. Analyze this query and generate Python pandas code to answer it.

Available dataset columns: {', '.join(dataset_columns)}

Dataset name: `df` (already loaded as pandas DataFrame)
Currency format function: `format_currency(amount)` - use this for displaying costs

User Query: "{message}"

Generate Python code that:
1. Filters/queries the dataframe as needed
2. Returns a formatted response string

Return ONLY executable Python code, no explanations. The code should assign the final response to a variable called `response`.

Example 1:
Query: "What is the lowest cost project in 2024?"
Code:
```python
df['date_parsed'] = pd.to_datetime(df['Project_Start_Date'], errors='coerce')
filtered = df[df['date_parsed'].dt.year == 2024].dropna(subset=['date_parsed'])
if len(filtered) > 0:
    min_row = filtered.loc[filtered['Actual_Cost_INR'].idxmin()]
    response = f"💰 **Lowest Cost Project in 2024**\\n\\n**Project ID:** {{min_row['Project_ID']}}\\n**Type:** {{min_row.get('Project_Type', 'N/A')}}\\n**Cost:** {{format_currency(min_row['Actual_Cost_INR'])}}\\n**Start Date:** {{min_row.get('Project_Start_Date', 'N/A')}}\\n**Overrun:** {{min_row.get('Cost_Overrun_Percent', 0):.2f}}%"
else:
    response = "No projects found for 2024"
```

Example 2:
Query: "How many projects in Maharashtra?"
Code:
```python
count = len(df[df['State'].str.contains('Maharashtra', na=False, case=False)])
response = f"📊 **Projects in Maharashtra:** {{count}}"
```

Example 3:
Query: "Average cost of 400kV projects"
Code:
```python
filtered = df[df['Voltage_Level_Kv'] == 400]
avg = filtered['Actual_Cost_INR'].mean()
response = f"📊 **Average Cost of 400kV Projects**\\n\\n**Count:** {{len(filtered)}}\\n**Average Cost:** {{format_currency(avg)}}"
```

Now generate code for the user's query."""

        response = gemini_model.generate_content(prompt)
        code = response.text.strip()
        
        # Extract code from markdown if present
        import re
        code = re.sub(r'```python\s*', '', code)
        code = re.sub(r'```\s*$', '', code)
        code = code.strip()
        
        return code
    except Exception as e:
        print(f"[WARN] Gemini code generation failed: {e}")
        return None

def find_project_reference(message: str, dataset):
    """Find project mentioned in message"""
    msg_lower = message.lower()
    
    # Check for context references
    if any(ref in msg_lower for ref in ["this", "that", "it", "same", "previous"]):
        if conversation_context["last_project_id"]:
            return conversation_context["last_project_id"]
    
    # Search for project ID in message
    for pid in dataset['Project_ID'].unique():
        if str(pid).lower() in msg_lower:
            return pid
    
    # Search for project ID parts
    words = msg_lower.split()
    for word in words:
        if len(word) > 5:  # Reasonable ID length
            matches = dataset[dataset['Project_ID'].str.lower().str.contains(word, na=False)]
            if len(matches) == 1:
                return matches.iloc[0]['Project_ID']
    
    return None

def get_project_details(project_id, dataset):
    """Get comprehensive project information"""
    project = dataset[dataset['Project_ID'] == project_id].iloc[0]
    
    # Calculate derived metrics
    actual_cost = project.get('Actual_Cost_INR', 0)
    target_cost = project.get('Target_Cost_INR', 0)
    cost_loss = actual_cost - target_cost if actual_cost and target_cost else 0
    
    actual_days = project.get('Actual_Duration_Days', 0)
    target_days = project.get('Target_Duration_Days', 0)
    time_delay = actual_days - target_days if actual_days and target_days else 0
    
    return {
        "project": project,
        "cost_loss": cost_loss,
        "time_delay": time_delay,
        "cost_overrun_pct": project.get('Cost_Overrun_Percent', 0)
    }

def format_currency(amount):
    """Format currency in Indian style"""
    if amount >= 10000000:  # 1 Crore
        return f"₹{amount/10000000:,.2f} Cr"
    elif amount >= 100000:  # 1 Lakh
        return f"₹{amount/100000:,.2f} L"
    else:
        return f"₹{amount:,.2f}"

def answer_loss_query(message: str, dataset):
    """Answer questions about losses/overruns"""
    project_id = find_project_reference(message, dataset)
    
    if project_id:
        details = get_project_details(project_id, dataset)
        project = details["project"]
        cost_loss = details["cost_loss"]
        
        response = f"""💸 **Financial Loss Analysis: {project_id}**

**Cost Summary:**
- Target Budget: {format_currency(project.get('Target_Cost_INR', 0))}
- Actual Spent: {format_currency(project.get('Actual_Cost_INR', 0))}
- **Loss/Overrun: {format_currency(cost_loss)}**
- Overrun Percentage: {details['cost_overrun_pct']:.2f}%

**Timeline Impact:**
- Planned Duration: {project.get('Target_Duration_Days', 0)} days
- Actual Duration: {project.get('Actual_Duration_Days', 0)} days
- Delay: {details['time_delay']} days

**Project Type:** {project.get('Project_Type', 'N/A')}
**Voltage Level:** {project.get('Voltage_Level_Kv', 'N/A')} kV"""
        
        # Store context
        conversation_context["last_project_id"] = project_id
        
        return response
    else:
        # Show overall losses
        if 'Actual_Cost_INR' in dataset.columns and 'Target_Cost_INR' in dataset.columns:
            dataset['Loss'] = dataset['Actual_Cost_INR'] - dataset['Target_Cost_INR']
            total_loss = dataset['Loss'].sum()
            avg_loss = dataset['Loss'].mean()
            worst_loss_project = dataset.loc[dataset['Loss'].idxmax()]
            
            response = f"""💸 **Overall Financial Losses Across All Projects**

**Total Loss:** {format_currency(total_loss)}
**Average Loss per Project:** {format_currency(avg_loss)}

**Worst Loss Project:**
- Project ID: {worst_loss_project['Project_ID']}
- Loss Amount: {format_currency(worst_loss_project['Loss'])}
- Overrun: {worst_loss_project.get('Cost_Overrun_Percent', 0):.2f}%

**Statistics:**
- Total Projects: {len(dataset)}
- Projects with losses: {len(dataset[dataset['Loss'] > 0])}
- Projects on/under budget: {len(dataset[dataset['Loss'] <= 0])}"""
            
            return response

def answer_cost_query(intents: list, message: str, dataset):
    """Answer cost-related queries"""
    msg_lower = message.lower()
    
    # Highest cost
    if "highest" in intents:
        max_row = dataset.loc[dataset['Actual_Cost_INR'].idxmax()]
        conversation_context["last_project_id"] = max_row['Project_ID']
        
        return f"""💰 **Highest Cost Project**

**Project ID:** {max_row['Project_ID']}
**Type:** {max_row.get('Project_Type', 'N/A')}
**Actual Cost:** {format_currency(max_row['Actual_Cost_INR'])}
**Target Cost:** {format_currency(max_row.get('Target_Cost_INR', 0))}
**Overrun:** {max_row.get('Cost_Overrun_Percent', 0):.2f}%
**Voltage:** {max_row.get('Voltage_Level_Kv', 'N/A')} kV

💡 *Ask "What problems did this project face?" for more details*"""
    
    # Lowest cost
    elif "lowest" in intents:
        min_row = dataset.loc[dataset['Actual_Cost_INR'].idxmin()]
        conversation_context["last_project_id"] = min_row['Project_ID']
        
        return f"""💰 **Lowest Cost Project**

**Project ID:** {min_row['Project_ID']}
**Type:** {min_row.get('Project_Type', 'N/A')}
**Actual Cost:** {format_currency(min_row['Actual_Cost_INR'])}
**Target Cost:** {format_currency(min_row.get('Target_Cost_INR', 0))}
**Status:** {min_row.get('Cost_Overrun_Percent', 0):.2f}% {'overrun' if min_row.get('Cost_Overrun_Percent', 0) > 0 else 'under budget'}"""
    
    # Average cost
    elif "average" in intents:
        avg_cost = dataset['Actual_Cost_INR'].mean()
        median_cost = dataset['Actual_Cost_INR'].median()
        
        return f"""📊 **Cost Statistics**

**Average Cost:** {format_currency(avg_cost)}
**Median Cost:** {format_currency(median_cost)}
**Total Projects:** {len(dataset)}

**Cost Distribution:**
- Minimum: {format_currency(dataset['Actual_Cost_INR'].min())}
- 25th Percentile: {format_currency(dataset['Actual_Cost_INR'].quantile(0.25))}
- 75th Percentile: {format_currency(dataset['Actual_Cost_INR'].quantile(0.75))}
- Maximum: {format_currency(dataset['Actual_Cost_INR'].max())}"""
    
    # Specific project cost
    else:
        project_id = find_project_reference(message, dataset)
        if project_id:
            details = get_project_details(project_id, dataset)
            project = details["project"]
            
            return f"""💰 **Cost Breakdown: {project_id}**

**Target Budget:** {format_currency(project.get('Target_Cost_INR', 0))}
**Actual Spent:** {format_currency(project.get('Actual_Cost_INR', 0))}
**Variance:** {format_currency(details['cost_loss'])} ({'over' if details['cost_loss'] > 0 else 'under'} budget)
**Overrun %:** {details['cost_overrun_pct']:.2f}%"""

def answer_problem_query(message: str, dataset):
    """Answer questions about problems/issues"""
    project_id = find_project_reference(message, dataset)
    
    if not project_id:
        return "⚠️ Please specify which project you're asking about. Try asking about a specific project first."
    
    project = dataset[dataset['Project_ID'] == project_id].iloc[0]
    conversation_context["last_project_id"] = project_id
    
    # Find all problem-related columns
    problem_cols = [col for col in dataset.columns if any(kw in col.lower() 
        for kw in ['problem', 'issue', 'risk', 'delay', 'reason', 'challenge', 'obstacle'])]
    
    response = f"""🔍 **Problems & Issues: {project_id}**

**Project Overview:**
- Type: {project.get('Project_Type', 'N/A')}
- Status: {project.get('Cost_Overrun_Percent', 0):.2f}% cost overrun
- Timeline Delay: {project.get('Actual_Duration_Days', 0) - project.get('Target_Duration_Days', 0)} days

**Identified Issues:**"""
    
    # Add all problem fields
    issue_count = 0
    for col in problem_cols:
        value = project.get(col)
        if pd.notna(value) and str(value).strip() and str(value) not in ['0', 'None', 'nan']:
            response += f"\n- **{col.replace('_', ' ').title()}:** {value}"
            issue_count += 1
    
    # Add other relevant details
    if issue_count == 0:
        response += "\n\n**Available Project Data:**"
        for col in ['Target_Duration_Days', 'Actual_Duration_Days', 'Project_Start_Date', 
                    'Project_End_Date_Planned', 'Project_End_Date_Actual', 'Voltage_Level_Kv']:
            if col in project.index:
                value = project[col]
                if pd.notna(value):
                    response += f"\n- **{col.replace('_', ' ').title()}:** {value}"
    
    # Add financial impact
    details = get_project_details(project_id, dataset)
    response += f"\n\n**Financial Impact:**\n- Additional Cost: {format_currency(details['cost_loss'])}"
    
    return response

def find_similar_projects(reference_project_id: str, dataset, top_n: int = 5):
    """Find projects similar to a reference project"""
    ref_project = dataset[dataset['Project_ID'] == reference_project_id].iloc[0]
    
    # Calculate similarity based on multiple factors
    similarities = []
    for idx, row in dataset.iterrows():
        if row['Project_ID'] == reference_project_id:
            continue
        
        score = 0
        factors = []
        
        # Same type
        if row.get('Project_Type') == ref_project.get('Project_Type'):
            score += 30
            factors.append("Same type")
        
        # Similar cost (within 20%)
        ref_cost = ref_project.get('Actual_Cost_INR', 0)
        row_cost = row.get('Actual_Cost_INR', 0)
        if ref_cost and row_cost:
            cost_diff = abs(ref_cost - row_cost) / ref_cost
            if cost_diff < 0.2:
                score += 25
                factors.append("Similar cost")
        
        # Same voltage level
        if row.get('Voltage_Level_Kv') == ref_project.get('Voltage_Level_Kv'):
            score += 20
            factors.append("Same voltage")
        
        # Similar duration
        ref_days = ref_project.get('Actual_Duration_Days', 0)
        row_days = row.get('Actual_Duration_Days', 0)
        if ref_days and row_days:
            days_diff = abs(ref_days - row_days) / ref_days
            if days_diff < 0.3:
                score += 15
                factors.append("Similar timeline")
        
        # Same state
        if 'State' in dataset.columns and row.get('State') == ref_project.get('State'):
            score += 10
            factors.append("Same state")
        
        if score > 0:
            similarities.append({
                'project_id': row['Project_ID'],
                'score': score,
                'factors': factors,
                'data': row
            })
    
    # Sort by similarity score
    similarities.sort(key=lambda x: x['score'], reverse=True)
    return similarities[:top_n]

def search_by_any_criteria(message: str, dataset):
    """Dynamically search dataset based on any criteria mentioned"""
    msg_lower = message.lower()
    words = msg_lower.split()
    
    # Find relevant columns based on keywords
    relevant_cols = []
    for col in dataset.columns:
        col_lower = col.lower().replace('_', ' ')
        if any(word in col_lower for word in words if len(word) > 3):
            relevant_cols.append(col)
    
    # If we found relevant columns, analyze them
    if relevant_cols:
        response = f"📊 **Analysis based on your query:**\n\n"
        
        for col in relevant_cols[:5]:  # Limit to 5 most relevant
            if dataset[col].dtype in ['int64', 'float64']:
                # Numerical analysis
                response += f"**{col.replace('_', ' ').title()}:**\n"
                response += f"- Average: {dataset[col].mean():.2f}\n"
                response += f"- Min: {dataset[col].min():.2f}\n"
                response += f"- Max: {dataset[col].max():.2f}\n\n"
            elif dataset[col].dtype == 'object':
                # Categorical analysis
                value_counts = dataset[col].value_counts().head(5)
                if len(value_counts) > 0:
                    response += f"**{col.replace('_', ' ').title()} (Top 5):**\n"
                    for val, count in value_counts.items():
                        response += f"- {val}: {count}\n"
                    response += "\n"
        
        return response
    
    return None

def answer_general_query(message: str, dataset):
    """Handle general queries intelligently with dynamic analysis"""
    msg_lower = message.lower()
    
    # Similar/like queries
    if any(word in msg_lower for word in ["similar", "like", "same as", "comparable"]):
        project_id = find_project_reference(message, dataset)
        
        if project_id:
            similar = find_similar_projects(project_id, dataset)
            
            if similar:
                ref_project = dataset[dataset['Project_ID'] == project_id].iloc[0]
                response = f"""🔍 **Projects Similar to {project_id}**

**Reference Project:**
- Type: {ref_project.get('Project_Type', 'N/A')}
- Cost: {format_currency(ref_project.get('Actual_Cost_INR', 0))}
- Voltage: {ref_project.get('Voltage_Level_Kv', 'N/A')} kV

**Top 5 Similar Projects:**
"""
                for i, sim in enumerate(similar, 1):
                    response += f"\n**{i}. {sim['project_id']}** (Similarity: {sim['score']}%)\n"
                    response += f"   Matches: {', '.join(sim['factors'])}\n"
                    response += f"   Cost: {format_currency(sim['data'].get('Actual_Cost_INR', 0))}\n"
                
                return response
        
        return "⚠️ Please specify which project you want to find similar ones to. Ask about a project first."
    
    # Try dynamic search based on any criteria
    dynamic_result = search_by_any_criteria(message, dataset)
    if dynamic_result:
        return dynamic_result
    
    # Count queries
    if any(phrase in msg_lower for phrase in ["how many", "count", "number of"]):
        # Extract what they're counting
        for col in dataset.columns:
            col_words = col.lower().replace('_', ' ').split()
            if any(word in msg_lower for word in col_words if len(word) > 3):
                if dataset[col].dtype == 'object':
                    unique_count = dataset[col].nunique()
                    value_counts = dataset[col].value_counts()
                    top_values = '\n'.join([f"- {val}: {count}" for val, count in value_counts.head(10).items()])
                    return f"""📊 **{col.replace('_', ' ').title()} Analysis**

**Total Unique Values:** {unique_count}
**Total Projects:** {len(dataset)}

**Breakdown (Top 10):**
{top_values}"""
                elif dataset[col].dtype in ['int64', 'float64']:
                    return f"""📊 **{col.replace('_', ' ').title()} Statistics**

**Total Projects:** {len(dataset)}
**Average:** {dataset[col].mean():.2f}
**Range:** {dataset[col].min():.2f} to {dataset[col].max():.2f}"""
        
        return f"📊 **Total Projects:** {len(dataset):,}"
    
    # Comparison queries
    if any(word in msg_lower for word in ["compare", "difference", "versus", "vs", "between"]):
        # Find what they want to compare
        for col in dataset.columns:
            if col.lower().replace('_', ' ') in msg_lower:
                if dataset[col].dtype == 'object':
                    comparison = dataset.groupby(col).agg({
                        'Actual_Cost_INR': ['mean', 'count'],
                        'Cost_Overrun_Percent': 'mean'
                    }).round(2)
                    
                    response = f"📊 **Comparison by {col.replace('_', ' ').title()}:**\n\n"
                    for idx, row in comparison.head(10).iterrows():
                        response += f"**{idx}:**\n"
                        response += f"- Count: {int(row[('Actual_Cost_INR', 'count')])}\n"
                        response += f"- Avg Cost: {format_currency(row[('Actual_Cost_INR', 'mean')])}\n"
                        response += f"- Avg Overrun: {row[('Cost_Overrun_Percent', 'mean')]:.2f}%\n\n"
                    
                    return response
    
    # List/show queries
    if any(word in msg_lower for word in ["list", "show", "display"]):
        for col in dataset.columns:
            col_words = col.lower().replace('_', ' ')
            if col_words in msg_lower or any(word in msg_lower for word in col_words.split() if len(word) > 4):
                if dataset[col].dtype == 'object':
                    unique_values = dataset[col].unique()[:20]
                    return f"📋 **{col.replace('_', ' ').title()} (showing up to 20):**\n\n" + '\n'.join([f"- {v}" for v in unique_values if pd.notna(v)])
                elif dataset[col].dtype in ['int64', 'float64']:
                    return f"""📊 **{col.replace('_', ' ').title()} Statistics:**

**Min:** {dataset[col].min():.2f}
**Max:** {dataset[col].max():.2f}
**Average:** {dataset[col].mean():.2f}
**Median:** {dataset[col].median():.2f}"""
    
    # Default: Provide intelligent suggestions based on available data
    return f"""💡 **I can answer any question about the power grid data!**

**Dataset:** {len(dataset):,} projects with {len(dataset.columns)} attributes

**Available Information:**
{', '.join(dataset.columns[:15].tolist())}... and {len(dataset.columns) - 15} more

**Example Questions You Can Ask:**
- "Is there any project similar to [project ID]?"
- "Compare projects by [any attribute]"
- "How many [attribute] are there?"
- "Show me all [attribute] values"
- "What's the difference between [A] and [B]?"
- "Find projects with [specific criteria]"

**Just ask naturally - I'll figure it out!** 🚀"""

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "dataset_loaded": dataset is not None,
        "model_loaded": model is not None,
        "dataset_rows": len(dataset) if dataset is not None else 0,
        "dataset_columns": len(dataset.columns) if dataset is not None else 0
    }

def extract_filters_from_query(message: str, dataset):
    """Extract filter criteria from natural language"""
    msg_lower = message.lower()
    filters = {}
    
    # Extract numeric comparisons
    import re
    
    # Cost filters
    cost_patterns = [
        (r'cost.*?(?:more than|greater than|above|over)\s*₹?\s*([\d,]+)', 'cost_min'),
        (r'cost.*?(?:less than|below|under)\s*₹?\s*([\d,]+)', 'cost_max'),
        (r'(?:more than|greater than|above|over)\s*₹?\s*([\d,]+)', 'cost_min'),
    ]
    
    for pattern, filter_type in cost_patterns:
        match = re.search(pattern, msg_lower)
        if match:
            value = float(match.group(1).replace(',', ''))
            filters[filter_type] = value
    
    # Overrun percentage filters
    if 'overrun' in msg_lower or 'over budget' in msg_lower:
        overrun_match = re.search(r'(\d+)%', msg_lower)
        if overrun_match:
            filters['overrun_pct'] = float(overrun_match.group(1))
    
    # Delay filters  
    if 'delay' in msg_lower:
        delay_match = re.search(r'(\d+)\s*days?', msg_lower)
        if delay_match:
            filters['delay_days'] = int(delay_match.group(1))
            
    # Voltage filters
    voltage_match = re.search(r'(\d+)\s*kv', msg_lower)
    if voltage_match:
        voltage_val = voltage_match.group(1) # Keep as string first
        # Try to find the voltage column
        voltage_cols = [c for c in dataset.columns if 'voltage' in c.lower() or 'kv' in c.lower()]
        if voltage_cols:
            col = voltage_cols[0]
            # Check if column is numeric
            if pd.api.types.is_numeric_dtype(dataset[col]):
                filters[col] = [float(voltage_val)]
            else:
                filters[col] = [voltage_val, f"{voltage_val}kV", f"{voltage_val} kV"]
    
    # Categorical filters
    for col in dataset.columns:
        if dataset[col].dtype == 'object':
            unique_vals = dataset[col].dropna().unique()
            for val in unique_vals:
                if str(val).lower() in msg_lower:
                    if col not in filters:
                        filters[col] = []
                    filters[col].append(val)
    
    return filters

def apply_filters(dataset, filters):
    """Apply extracted filters to dataset"""
    filtered = dataset.copy()
    
    if 'cost_min' in filters:
        filtered = filtered[filtered['Actual_Cost_INR'] >= filters['cost_min']]
    if 'cost_max' in filters:
        filtered = filtered[filtered['Actual_Cost_INR'] <= filters['cost_max']]
    if 'overrun_pct' in filters:
        filtered = filtered[filtered['Cost_Overrun_Percent'] >= filters['overrun_pct']]
    if 'delay_days' in filters:
        filtered = filtered[filtered['Timeline_Overrun_Days'] >= filters['delay_days']]
    
    # Apply categorical filters
    for col, values in filters.items():
        if col in dataset.columns and isinstance(values, list):
            filtered = filtered[filtered[col].isin(values)]
    
    return filtered

@app.post("/api/chat")
async def chat(request: dict):
    message = request.get("message", "").strip()
    
    try:
        if dataset is None:
            return {"response": "⚠️ Dataset not loaded. Please restart the backend.", "sources": []}
        
        if not message:
            return {"response": "Please ask a question about the power grid projects.", "sources": []}
        
        # Use Gemini to generate code for ANY question
        print(f"\n{'='*60}")
        print(f"[QUERY] User Query: {message}")
        print(f"[INFO] Attempting Gemini code generation...")
        
        generated_code = analyze_query_with_gemini(message, dataset.columns.tolist())
        
        if generated_code:
            print(f"[INFO] Code generated successfully")
            print(f"{'='*60}")
            try:
                print(generated_code.encode('utf-8', errors='ignore').decode('utf-8'))
            except:
                print("[INFO] (Code contains characters that cannot be printed to console)")
            print(f"{'='*60}")
            
            try:
                # Execute the generated code
                df = dataset.copy()
                local_vars = {
                    'df': df,
                    'pd': pd,
                    'np': np,
                    'format_currency': format_currency,
                    'response': ''
                }
                
                exec(generated_code, local_vars)
                response = local_vars.get('response', 'No response generated')
                
                if response and response != 'No response generated':
                    print(f"[INFO] Code executed successfully")
                    print(f"[INFO] Response (first 200 chars): {response[:200]}...")
                    return {"response": response, "sources": ["Final_dataset.csv"]}
                else:
                    print(f"[WARN] Code executed but no response generated")
                
            except Exception as e:
                print(f"[ERROR] Code execution error: {str(e)}")
                import traceback
                traceback.print_exc()
        else:
            print(f"[WARN] Gemini code generation returned None")
        
        print(f"[INFO] Falling back to intent-based logic")
        
        # Fallback to original intent-based logic if Gemini fails
        intents = extract_intent(message)
        print(f"[DEBUG] Detected intents: {intents}")
        
        # Check for date filtering first
        filtered_df = dataset.copy()
        date_filter_applied = False
        
        if "date_filter" in intents:
            date_filter = extract_date_filter(message)
            
            if date_filter and 'date_field' in date_filter:
                # Convert date column to datetime
                filtered_df['date_parsed'] = pd.to_datetime(filtered_df[date_filter['date_field']], errors='coerce')
                
                # Filter by year and month if provided
                if 'year' in date_filter:
                    filtered_df = filtered_df[filtered_df['date_parsed'].dt.year == date_filter['year']]
                if 'month' in date_filter:
                    filtered_df = filtered_df[filtered_df['date_parsed'].dt.month == date_filter['month']]
                
                # Remove rows with invalid dates
                filtered_df = filtered_df[filtered_df['date_parsed'].notna()]
                date_filter_applied = True
                print(f"[DEBUG] Date filter applied. Rows: {len(filtered_df)}")
                
                if len(filtered_df) == 0:
                    return {
                        "response": f"No projects found for the specified time period.",
                        "sources": ["Final_dataset.csv"]
                    }

        # If we have a date filter but also a specific intent like "lowest cost", pass the filtered DF
        if date_filter_applied and ("lowest" in intents or "highest" in intents):
             if "cost_query" in intents or "lowest" in intents or "highest" in intents:
                 response = answer_cost_query(intents, message, filtered_df)
                 return {"response": response, "sources": ["Final_dataset.csv"]}

        # If ONLY date filter was applied (no other specific intent), return the list
        if date_filter_applied:
                # Build response
                time_desc = ""
                if 'month_name' in date_filter and 'year' in date_filter:
                    time_desc = f"{date_filter['month_name']} {date_filter['year']}"
                elif 'year' in date_filter:
                    time_desc = f"{date_filter['year']}"
                elif 'month_name' in date_filter:
                    time_desc = f"{date_filter['month_name']}"
                
                date_type = "started" if date_filter['date_field'] == 'Project_Start_Date' else "completed"
                
                response = f"""📅 **Projects {date_type} during {time_desc}**

**Total Projects:** {len(filtered_df)}

**Statistics:**
- Total Cost: {format_currency(filtered_df['Actual_Cost_INR'].sum())}
- Average Cost: {format_currency(filtered_df['Actual_Cost_INR'].mean())}
- Average Overrun: {filtered_df['Cost_Overrun_Percent'].mean():.2f}%

**Top 5 Projects by Cost:**
"""
                for idx, (_, row) in enumerate(filtered_df.nlargest(5, 'Actual_Cost_INR').iterrows(), 1):
                    response += f"\n{idx}. **{row['Project_ID']}**"
                    response += f"\n   - Type: {row.get('Project_Type', 'N/A')}"
                    response += f"\n   - Cost: {format_currency(row['Actual_Cost_INR'])}"
                    response += f"\n   - Start: {row.get('Project_Start_Date', 'N/A')}"
                
                return {"response": response, "sources": ["Final_dataset.csv"]}
        
        # Check for filtering queries (find/show/get projects with specific criteria)
        
        # Check for filtering queries (find/show/get projects with specific criteria)
        if any(word in message.lower() for word in ["find", "show me", "get", "filter", "projects with", "projects that", "how many"]):
            filters = extract_filters_from_query(message, dataset)
            
            if filters:
                filtered = apply_filters(dataset, filters)
                
                if len(filtered) == 0:
                    return {
                        "response": f"No projects found matching your criteria: {filters}",
                        "sources": ["Final_dataset.csv"]
                    }
                
                # If asking for count
                if "how many" in message.lower() or "count" in message.lower():
                     response = f"📊 **Found {len(filtered)} projects matching your criteria**\n\n"
                     response += f"**Filters applied:**\n"
                     for k, v in filters.items():
                         if isinstance(v, list):
                             response += f"- {k}: {', '.join(map(str, v))}\n"
                         else:
                             response += f"- {k}: {v}\n"
                     
                     return {"response": response, "sources": ["Final_dataset.csv"]}

                response = f"🔍 **Found {len(filtered)} projects matching your criteria**\n\n"
                
                # Show summary stats
                if len(filtered) <= 10:
                    response += "**Projects:**\n"
                    for _, row in filtered.head(10).iterrows():
                        response += f"\n**{row['Project_ID']}**\n"
                        response += f"- Type: {row.get('Project_Type', 'N/A')}\n"
                        response += f"- Cost: {format_currency(row.get('Actual_Cost_INR', 0))}\n"
                        response += f"- Overrun: {row.get('Cost_Overrun_Percent', 0):.2f}%\n"
                else:
                    response += f"**Summary Statistics:**\n"
                    response += f"- Total Matching: {len(filtered)}\n"
                    response += f"- Avg Cost: {format_currency(filtered['Actual_Cost_INR'].mean())}\n"
                    response += f"- Avg Overrun: {filtered['Cost_Overrun_Percent'].mean():.2f}%\n\n"
                    response += "**Top 5 by Cost:**\n"
                    for _, row in filtered.nlargest(5, 'Actual_Cost_INR').iterrows():
                        response += f"- {row['Project_ID']}: {format_currency(row['Actual_Cost_INR'])}\n"
                
                return {"response": response, "sources": ["Final_dataset.csv"]}
        
        # Route to appropriate handler
        if "loss" in intents:
            response = answer_loss_query(message, dataset)
        elif "problem" in intents:
            response = answer_problem_query(message, dataset)
        elif "latest" in intents or "oldest" in intents:
            # Handle date-based queries
            if 'Project_End_Date_Actual' in dataset.columns:
                dataset['date_parsed'] = pd.to_datetime(dataset['Project_End_Date_Actual'], errors='coerce')
                
                if "latest" in intents:
                    latest_project = dataset.loc[dataset['date_parsed'].idxmax()]
                    conversation_context["last_project_id"] = latest_project['Project_ID']
                    
                    response = f"""📅 **Latest Completed Project**

**Project ID:** {latest_project['Project_ID']}
**Type:** {latest_project.get('Project_Type', 'N/A')}
**Completion Date:** {latest_project.get('Project_End_Date_Actual', 'N/A')}
**Cost:** {format_currency(latest_project.get('Actual_Cost_INR', 0))}
**Duration:** {latest_project.get('Actual_Duration_Days', 0)} days
**Overrun:** {latest_project.get('Cost_Overrun_Percent', 0):.2f}%
**Voltage:** {latest_project.get('Voltage_Level_Kv', 'N/A')} kV

💡 *Ask "What problems did this project face?" for more details*"""
                else:
                    oldest_project = dataset.loc[dataset['date_parsed'].idxmin()]
                    conversation_context["last_project_id"] = oldest_project['Project_ID']
                    
                    response = f"""📅 **Earliest Project**

**Project ID:** {oldest_project['Project_ID']}
**Type:** {oldest_project.get('Project_Type', 'N/A')}
**Start Date:** {oldest_project.get('Project_Start_Date', 'N/A')}
**Completion Date:** {oldest_project.get('Project_End_Date_Actual', 'N/A')}
**Cost:** {format_currency(oldest_project.get('Actual_Cost_INR', 0))}"""
            else:
                response = "⚠️ Date information not available in dataset"
        elif "cost_query" in intents:
            response = answer_cost_query(intents, message, dataset)
        else:
            response = answer_general_query(message, dataset)
        
        return {"response": response, "sources": ["Final_dataset.csv"]}
    
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        try:
            print(f"[ERROR] Error: {error_details}")
        except:
            print(f"[ERROR] An error occurred (details cannot be printed)")
        return {
            "response": f"⚠️ An error occurred: {str(e)}\n\nPlease try rephrasing your question.",
            "sources": []
        }

if __name__ == "__main__":
    print("[INFO] Starting PowerGrid AI Backend...")
    print("[INFO] Intelligent NLP-powered analysis")
    uvicorn.run(app, host="0.0.0.0", port=8501, log_level="info")
