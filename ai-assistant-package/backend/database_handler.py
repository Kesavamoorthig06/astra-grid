import sqlite3
import pandas as pd
from typing import Dict, List, Any
import os

class DatabaseHandler:
    """Handle database operations for power grid data"""
    
    def __init__(self, db_path: str = 'power_grid.db'):
        self.db_path = db_path
    
    def get_connection(self):
        """Get database connection"""
        return sqlite3.connect(self.db_path)
    
    def initialize_database(self):
        """Initialize database from CSV"""
        if os.path.exists(self.db_path):
            print(f"Database {self.db_path} already exists.")
            return
        
        print("Initializing database from CSV...")
        df = pd.read_csv('Final_dataset.csv')
        conn = self.get_connection()
        df.to_sql('projects', conn, if_exists='replace', index=False)
        
        cursor = conn.cursor()
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_region ON projects(Regulatory_Hotspot_Region)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_project_type ON projects(Project_Type)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_voltage ON projects(Voltage_Level_kV)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_year ON projects(Year)')
        
        conn.commit()
        conn.close()
        print(f"Database initialized with {len(df)} records.")
    
    def get_dashboard_stats(self) -> Dict:
        """Get statistics for dashboard"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM projects")
        total_projects = cursor.fetchone()[0]
        
        cursor.execute("SELECT SUM(Actual_Cost_INR) FROM projects")
        total_cost = cursor.fetchone()[0] or 0
        
        cursor.execute("SELECT AVG(Cost_Overrun_Percent) FROM projects WHERE Cost_Overrun_Percent > 0")
        avg_overrun = cursor.fetchone()[0] or 0
        
        cursor.execute("SELECT COUNT(*) FROM projects WHERE Timeline_Overrun_Days > 0")
        delayed_projects = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT Regulatory_Hotspot_Region, COUNT(*) as count 
            FROM projects 
            WHERE Regulatory_Hotspot_Region != ''
            GROUP BY Regulatory_Hotspot_Region 
            ORDER BY count DESC 
            LIMIT 5
        """)
        top_regions = [{'region': row[0], 'count': row[1]} for row in cursor.fetchall()]
        
        conn.close()
        
        return {
            'total_projects': total_projects,
            'total_cost': total_cost / 10000000,
            'avg_cost_overrun': round(avg_overrun, 2),
            'delayed_projects': delayed_projects,
            'top_regions': top_regions
        }
    
    def get_recent_projects(self, limit: int = 10) -> List[Dict]:
        """Get recent projects"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(f"""
            SELECT Project_ID, Project_Type, Actual_Cost_INR, 
                   Actual_Duration_Days, Regulatory_Hotspot_Region, Year
            FROM projects 
            ORDER BY Project_Start_Date DESC 
            LIMIT {limit}
        """)
        
        columns = [desc[0] for desc in cursor.description]
        projects = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        conn.close()
        return projects
    
    def count_projects(self, entities: Dict) -> int:
        """Count projects based on filters"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        query = "SELECT COUNT(*) FROM projects WHERE 1=1"
        params = []
        
        if 'region' in entities:
            query += " AND Regulatory_Hotspot_Region = ?"
            params.append(entities['region'])
        
        if 'project_type' in entities:
            query += " AND Project_Type LIKE ?"
            params.append(f"%{entities['project_type']}%")
        
        cursor.execute(query, params)
        count = cursor.fetchone()[0]
        
        conn.close()
        return count
    
    def get_cost_analysis(self, entities: Dict) -> Dict:
        """Get cost analysis"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT 
                COUNT(*) as total_projects,
                AVG(Cost_Overrun_Percent) as avg_overrun,
                SUM(Actual_Cost_INR) as total_cost,
                AVG(Actual_Cost_INR) as avg_cost
            FROM projects WHERE 1=1
        """
        params = []
        
        if 'region' in entities:
            query += " AND Regulatory_Hotspot_Region = ?"
            params.append(entities['region'])
        
        cursor.execute(query, params)
        row = cursor.fetchone()
        
        conn.close()
        
        return {
            'total_projects': row[0],
            'avg_overrun': row[1] or 0,
            'total_cost': row[2] / 10000000 if row[2] else 0,
            'avg_cost': row[3] / 10000000 if row[3] else 0
        }
    
    def get_timeline_analysis(self, entities: Dict) -> Dict:
        """Get timeline analysis"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                COUNT(*) as total_projects,
                AVG(Timeline_Overrun_Days) as avg_delay,
                COUNT(CASE WHEN Timeline_Overrun_Days > 0 THEN 1 END) as delayed_count
            FROM projects
        """)
        
        row = cursor.fetchone()
        conn.close()
        
        return {
            'total_projects': row[0],
            'avg_delay': round(row[1] or 0, 2),
            'delayed_count': row[2]
        }
    
    def get_region_data(self, region: str) -> Dict:
        """Get data for a specific region"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                COUNT(*) as project_count,
                AVG(Actual_Cost_INR) as avg_cost,
                SUM(Actual_Cost_INR) as total_cost,
                AVG(Timeline_Overrun_Days) as avg_delay
            FROM projects
            WHERE Regulatory_Hotspot_Region = ?
        """, (region,))
        
        row = cursor.fetchone()
        conn.close()
        
        return {
            'project_count': row[0],
            'avg_cost': row[1] or 0,
            'total_cost': row[2] or 0,
            'avg_delay': row[3] or 0
        }
    
    def get_project_details(self, project_id: str) -> Dict:
        """Get details of a specific project"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM projects WHERE Project_ID = ? LIMIT 1", (project_id,))
        row = cursor.fetchone()
        
        if row:
            columns = [desc[0] for desc in cursor.description]
            result = dict(zip(columns, row))
        else:
            result = None
        
        conn.close()
        return result
    
    def get_cost_overrun_projects(self) -> List[Dict]:
        """Get projects with cost overruns"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT Project_ID, Project_Type, Cost_Overrun_Percent, 
                   Actual_Cost_INR, Regulatory_Hotspot_Region
            FROM projects 
            WHERE Cost_Overrun_Percent > 0
            ORDER BY Cost_Overrun_Percent DESC
            LIMIT 20
        """)
        
        columns = [desc[0] for desc in cursor.description]
        projects = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        conn.close()
        return projects
    
    def get_projects_by_voltage(self, voltage: str) -> List[Dict]:
        """Get projects by voltage level"""
        voltage_num = voltage.replace('kV', '').strip()
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT Project_ID, Project_Type, Voltage_Level_kV, 
                   Actual_Cost_INR, Regulatory_Hotspot_Region
            FROM projects 
            WHERE Voltage_Level_kV = ?
            LIMIT 50
        """, (voltage_num,))
        
        columns = [desc[0] for desc in cursor.description]
        projects = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        conn.close()
        return projects
    
    def search_general(self, query: str) -> List[Dict]:
        """General search across projects"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT Project_ID, Project_Type, Actual_Cost_INR, 
                   Regulatory_Hotspot_Region, Year
            FROM projects 
            WHERE Project_ID LIKE ? OR Project_Type LIKE ?
            LIMIT 10
        """, (f"%{query}%", f"%{query}%"))
        
        columns = [desc[0] for desc in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        conn.close()
        return results
    
    def get_highest_cost_project(self) -> Dict:
        """Get the project with highest cost"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT Project_ID, Project_Type, Actual_Cost_INR, 
                   Target_Cost_INR, Cost_Overrun_Percent,
                   Regulatory_Hotspot_Region, Year, 
                   Actual_Duration_Days, Voltage_Level_kV
            FROM projects 
            ORDER BY Actual_Cost_INR DESC 
            LIMIT 1
        """)
        
        row = cursor.fetchone()
        if row:
            columns = [desc[0] for desc in cursor.description]
            result = dict(zip(columns, row))
        else:
            result = None
        
        conn.close()
        return result
    
    def get_lowest_cost_project(self) -> Dict:
        """Get the project with lowest cost"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT Project_ID, Project_Type, Actual_Cost_INR, 
                   Target_Cost_INR, Cost_Overrun_Percent,
                   Regulatory_Hotspot_Region, Year, 
                   Actual_Duration_Days, Voltage_Level_kV
            FROM projects 
            WHERE Actual_Cost_INR > 0
            ORDER BY Actual_Cost_INR ASC 
            LIMIT 1
        """)
        
        row = cursor.fetchone()
        if row:
            columns = [desc[0] for desc in cursor.description]
            result = dict(zip(columns, row))
        else:
            result = None
        
        conn.close()
        return result
    
    def execute_custom_query(self, sql_query: str) -> Any:
        """Execute a custom SQL query safely"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            if not sql_query.strip().upper().startswith('SELECT'):
                return []
            
            cursor.execute(sql_query)
            
            if cursor.description:
                columns = [desc[0] for desc in cursor.description]
                results = [dict(zip(columns, row)) for row in cursor.fetchall()]
            else:
                results = []
            
            conn.close()
            return results
            
        except Exception as e:
            print(f"Error executing custom query: {e}")
            conn.close()
            return []
    
    def get_similar_projects(self, voltage: int = None, region: str = None, limit: int = 5) -> List[Dict]:
        """Get projects similar to a reference project"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            conditions = []
            
            if voltage:
                conditions.append(f"Voltage_Level_kV = {voltage}")
            if region:
                conditions.append(f"Regulatory_Hotspot_Region = '{region}'")
            
            where_clause = " AND ".join(conditions) if conditions else "1=1"
            
            query = f"""
                SELECT * FROM projects 
                WHERE {where_clause}
                ORDER BY Actual_Cost_INR DESC 
                LIMIT {limit}
            """
            
            cursor.execute(query)
            columns = [desc[0] for desc in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            conn.close()
            return results
            
        except Exception as e:
            print(f"Error finding similar projects: {e}")
            conn.close()
            return []
