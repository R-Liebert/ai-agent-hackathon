from fastapi import APIRouter, HTTPException
from app.services.graph_service import graph_service
from app.services.llm_service import llm_service
import uuid
from datetime import datetime

from app.models.schemas import IssueCreate

router = APIRouter()

@router.get("/proposal/{conversation_id}")
async def get_issue_proposal(conversation_id: str):
    """Generate a summary and classification proposal from the LLM, but do not persist it yet."""
    # 1. Get conversation history
    history_query = """
    MATCH (c:Conversation {id: $conv_id})-[:HAS_MESSAGE]->(m:Message)
    RETURN m.role as role, m.content as content
    ORDER BY m.timestamp ASC
    """
    history = graph_service.run_query(history_query, {"conv_id": conversation_id})
    if not history:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    transcript = "\n".join([f"{m['role']}: {m['content']}" for m in history])
    
    # 2. Summarize and classify with LLM
    structured_proposal = await llm_service.summarize_and_classify(transcript)
    if not structured_proposal:
        raise HTTPException(status_code=500, detail="Failed to generate proposal from LLM")
    
    return structured_proposal

@router.post("/confirm/{conversation_id}")
async def confirm_issue(conversation_id: str, issue_data: IssueCreate):
    """Receive the confirmed/edited issue data and persist it to the graph."""
    issue_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    # 1. Create Issue node
    issue_query = """
    MERGE (i:Issue {id: $id})
    SET i += $props, i.status = 'new', i.created_at = $now, i.updated_at = $now
    WITH i
    MATCH (c:Conversation {id: $conv_id})
    MERGE (i)-[:HAS_CONVERSATION]->(c)
    RETURN i
    """
    # Prepare properties (exclude the nested list)
    props = issue_data.dict(exclude={'capability_domains'})
    graph_service.run_query(issue_query, {
        "id": issue_id,
        "props": props,
        "now": now,
        "conv_id": conversation_id
    })
    
    # 2. Link Capability Domains and Recommended Teams
    for domain in issue_data.capability_domains:
        domain_query = """
        MATCH (i:Issue {id: $issue_id})
        MATCH (c:CapabilityDomain {name: $domain_name})
        MERGE (i)-[:BELONGS_TO_DOMAIN {confidence: $confidence, rationale: $rationale}]->(c)
        WITH i, c
        MATCH (t:Team)-[:OWNS_DOMAIN]->(c)
        MERGE (i)-[:RECOMMENDED_TEAM]->(t)
        """
        graph_service.run_query(domain_query, {
            "issue_id": issue_id,
            "domain_name": domain.name,
            "confidence": domain.confidence,
            "rationale": domain.rationale
        })
    
    return {"issue_id": issue_id, "status": "persisted"}

@router.get("/")
async def list_issues(domain: str = None, team: str = None, status: str = None, search: str = None):
    query = """
    MATCH (i:Issue)
    WHERE ($status IS NULL OR i.status = $status)
    AND ($search IS NULL OR i.title CONTAINS $search OR i.description CONTAINS $search)
    OPTIONAL MATCH (i)-[:BELONGS_TO_DOMAIN]->(d:CapabilityDomain)
    WHERE ($domain IS NULL OR d.name = $domain)
    OPTIONAL MATCH (i)-[:RECOMMENDED_TEAM]->(t:Team)
    WHERE ($team IS NULL OR t.name = $team)
    RETURN i.id as id, i.title as title, i.status as status, i.created_at as created_at,
           collect(distinct d.name) as capability_domains,
           collect(distinct t.name) as recommended_teams
    ORDER BY i.created_at DESC
    """
    results = graph_service.run_query(query, {"domain": domain, "team": team, "status": status, "search": search})
    return results

@router.get("/{issue_id}")
async def get_issue(issue_id: str):
    query = """
    MATCH (i:Issue {id: $id})
    OPTIONAL MATCH (i)-[r:BELONGS_TO_DOMAIN]->(d:CapabilityDomain)
    OPTIONAL MATCH (i)-[:RECOMMENDED_TEAM]->(t:Team)
    RETURN i {.*} as details,
           collect(distinct {name: d.name, confidence: r.confidence, rationale: r.rationale}) as domains,
           collect(distinct t.name) as teams
    """
    result = graph_service.run_query(query, {"id": issue_id})
    if not result:
        raise HTTPException(status_code=404, detail="Issue not found")
    return result[0]
