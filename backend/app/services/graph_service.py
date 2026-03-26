from neo4j import GraphDatabase
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class GraphService:
    def __init__(self):
        self.driver = None
        try:
            auth = None
            if settings.NEO4J_PASSWORD:
                auth = (settings.NEO4J_USERNAME, settings.NEO4J_PASSWORD)
            
            self.driver = GraphDatabase.driver(
                settings.NEO4J_URI,
                auth=auth
            )
            self.driver.verify_connectivity()
            logger.info("Successfully connected to Neo4j")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")

    def close(self):
        if self.driver:
            self.driver.close()

    def get_session(self):
        return self.driver.session()

    def run_query(self, query, parameters=None):
        with self.get_session() as session:
            result = session.run(query, parameters)
            return [record.data() for record in result]

    def seed_initial_data(self):
        """Seed capability domains, departments, and teams."""
        queries = [
            # Create Constraints
            "CREATE CONSTRAINT IF NOT EXISTS FOR (c:CapabilityDomain) REQUIRE c.id IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (d:Department) REQUIRE d.id IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (t:Team) REQUIRE t.id IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (i:Issue) REQUIRE i.id IS UNIQUE",

            # Capability Domains
            """
            UNWIND [
                {id: 'nlp', name: 'NLP', description: 'Natural Language Processing, text analysis, and GenAI text models'},
                {id: 'cv', name: 'Computer Vision', description: 'Image and video analysis, object detection'},
                {id: 'genai', name: 'GenAI', description: 'Generative AI for images, code, and creative tasks'},
                {id: 'timeseries', name: 'Time Series Forecasting', description: 'Predictive analytics based on historical trends'},
                {id: 'analytics', name: 'Analytics/BI', description: 'Business intelligence and classic data analytics'},
                {id: 'automation', name: 'Integration/Automation', description: 'System integrations and automated workflows'},
                {id: 'dataeng', name: 'Data Engineering', description: 'Data pipelines and ETL processes'},
                {id: 'other', name: 'Other', description: 'Issues that do not fit into specific domains'}
            ] as domain
            MERGE (c:CapabilityDomain {id: domain.id})
            SET c.name = domain.name, c.description = domain.description
            """,

            # Departments
            """
            UNWIND [
                {id: 'hr', name: 'HR', description: 'Human Resources'},
                {id: 'finance', name: 'Finance', description: 'Financial planning and accounting'},
                {id: 'ops', name: 'Operations', description: 'Business operations'},
                {id: 'sales', name: 'Sales', description: 'Sales and marketing'},
                {id: 'it', name: 'IT', description: 'Information Technology'}
            ] as dept
            MERGE (d:Department {id: dept.id})
            SET d.name = dept.name, d.description = dept.description
            """,

            # Teams and Mapping to Domains
            """
            UNWIND [
                {id: 'nlp_team', name: 'NLP & Text Analytics Team', domains: ['nlp', 'genai']},
                {id: 'cv_team', name: 'Computer Vision Team', domains: ['cv']},
                {id: 'forecasting_team', name: 'Forecasting & Analytics', domains: ['timeseries', 'analytics']},
                {id: 'automation_team', name: 'Integration & Automation', domains: ['automation']},
                {id: 'data_team', name: 'Data Engineering Team', domains: ['dataeng']}
            ] as team
            MERGE (t:Team {id: team.id})
            SET t.name = team.name
            WITH t, team.domains as domains
            UNWIND domains as domain_id
            MATCH (c:CapabilityDomain {id: domain_id})
            MERGE (t)-[:OWNS_DOMAIN]->(c)
            """
        ]
        for query in queries:
            self.run_query(query)
        logger.info("Successfully seeded initial data")

graph_service = GraphService()
