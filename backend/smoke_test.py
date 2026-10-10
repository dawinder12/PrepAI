import sys
import httpx
import json

BASE_URL = "http://127.0.0.1:8001/api"

def run_smoke_test():
    print("=========================================")
    print("Starting PrepAI End-to-End Smoke Test")
    print("=========================================\n")

    client = httpx.Client(base_url=BASE_URL, timeout=30.0)

    # 1. Health check
    print("[1/13] Checking API health...")
    r = client.get("/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    print("  [PASS] API is healthy.")

    # 2. Config status
    print("\n[2/13] Checking Configuration Diagnostics...")
    r = client.get("/config/status")
    assert r.status_code == 200, f"Config check failed: {r.text}"
    cfg = r.json()
    print(f"  [PASS] Database: {cfg['database_type']} | LLM Provider: {cfg['llm_provider']} | RAG: {cfg['rag_ready']}")

    # 3. User Registration
    test_email = f"candidate_test_{abs(hash('unique_test_candidate_2026'))}@example.com"
    print(f"\n[3/13] Registering new user ({test_email})...")
    reg_payload = {
        "email": test_email,
        "password": "Password123!",
        "full_name": "Jordan Lee",
        "target_role": "Senior Backend Engineer",
        "experience_level": "Senior"
    }
    r = client.post("/auth/register", json=reg_payload)
    if r.status_code != 200:
        r = client.post("/auth/login", json={"email": test_email, "password": "Password123!"})
    assert r.status_code == 200, f"Auth failed: {r.text}"
    auth_data = r.json()
    token = auth_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("  [PASS] Registered and authenticated successfully. JWT obtained.")

    # 4. Resume Ingestion
    print("\n[4/13] Uploading and parsing resume text...")
    sample_resume = """
    Jordan Lee
    Email: jordan.lee@example.com
    Phone: (555) 234-5678
    Summary: Senior Software Engineer with 6 years building distributed APIs in Python, FastAPI, and PostgreSQL.
    
    Skills: Python, FastAPI, PostgreSQL, Docker, Git, REST API, Microservices, Redis
    
    Experience:
    Senior Backend Engineer at CloudScale Inc (2022 - Present)
    - Architected high-throughput async FastAPI microservices handling 20,000 req/sec.
    - Optimized PostgreSQL query execution plans, indexing strategies, and connection pooling.
    
    Education:
    B.S. in Computer Science, State University, 2018
    """
    r = client.post("/resumes/upload", data={"raw_text": sample_resume}, headers=headers)
    assert r.status_code == 200, f"Resume upload failed: {r.text}"
    resume_res = r.json()
    resume_id = resume_res["id"]
    detected_skills = resume_res["profile"]["skills"]
    print(f"  [PASS] Resume parsed. Identified {len(detected_skills)} skills: {', '.join(detected_skills[:5])}...")

    # 5. Job Description Ingestion
    print("\n[5/13] Ingesting target job description...")
    sample_jd = """
    We are seeking a Senior Backend Engineer to join our infrastructure team.
    Requirements:
    - 5+ years building backend systems using Python, FastAPI, and PostgreSQL.
    - Deep expertise in Distributed Systems, System Design, and Kafka event streaming.
    - Experience with Kubernetes and Redis caching architecture.
    """
    r = client.post("/job-descriptions/", json={
        "title": "Senior Backend Engineer",
        "company": "NextGen Scale",
        "raw_text": sample_jd
    }, headers=headers)
    assert r.status_code == 200, f"Job description failed: {r.text}"
    job_res = r.json()
    job_id = job_res["id"]
    print(f"  [PASS] Target job ingested: {job_res['title']} at {job_res['company']}.")

    # 6. Skill Gap Analysis
    print("\n[6/13] Running Skill Gap Matrix Analysis...")
    r = client.post("/analyze/skill-gap", json={"resume_id": resume_id, "job_id": job_id}, headers=headers)
    assert r.status_code == 200, f"Skill gap failed: {r.text}"
    gap_res = r.json()
    print(f"  [PASS] Skill Gap Match Score: {gap_res['match_score']}%")
    print(f"    - Strong Matches ({len(gap_res['strong_matches'])}): {', '.join(gap_res['strong_matches'][:4])}")
    print(f"    - Missing Skills ({len(gap_res['missing_skills'])}): {[m['skill'] for m in gap_res['missing_skills'][:3]]}")

    # 7. Preparation Plan Generation
    print("\n[7/13] Generating personalized 4-week study plan...")
    r = client.post("/preparation-plans/generate", json={"duration_weeks": 4}, headers=headers)
    assert r.status_code == 200, f"Plan generation failed: {r.text}"
    plan_res = r.json()
    print(f"  [PASS] Generated study plan with {plan_res['total_topics']} topics across {plan_res['duration_weeks']} weeks.")

    # 8. Toggle Plan Topic Completion
    first_topic_id = plan_res["topics"][0]["id"]
    print(f"\n[8/13] Marking topic '{plan_res['topics'][0]['title']}' as completed...")
    r = client.post(f"/preparation-plans/topics/{first_topic_id}/toggle", headers=headers)
    assert r.status_code == 200, f"Topic toggle failed: {r.text}"
    topic_toggle = r.json()
    print(f"  [PASS] Topic status toggled. Plan progress: {topic_toggle['progress_percentage']}%")

    # 9. RAG Document Ingestion
    print("\n[9/13] Uploading study material to user-isolated RAG vault...")
    doc_content = b"PostgreSQL Write-Ahead Logging (WAL) ensures durability by recording changes before they are written to data pages. During crash recovery, REDO processes replay log records to restore the database to a consistent state."
    files = {"file": ("wal_architecture.txt", doc_content, "text/plain")}
    data = {"topic": "PostgreSQL Durability and WAL"}
    r = client.post("/documents/upload", files=files, data=data, headers=headers)
    assert r.status_code == 200, f"RAG upload failed: {r.text}"
    print("  [PASS] Document chunked and embedded in vector storage.")

    # 10. Semantic RAG Query
    print("\n[10/13] Querying RAG vault using semantic search...")
    r = client.post("/documents/query", json={"query": "How does write ahead logging prevent data loss?", "limit": 2}, headers=headers)
    assert r.status_code == 200, f"RAG query failed: {r.text}"
    rag_query_res = r.json()
    assert len(rag_query_res["results"]) > 0, "No RAG chunks retrieved!"
    top_chunk = rag_query_res["results"][0]
    print(f"  [PASS] Retrieved relevant chunk (Sim: {top_chunk['similarity_score']}): \"{top_chunk['content'][:80]}...\"")

    # 11. Start LangGraph Mock Interview
    print("\n[11/13] Launching LangGraph AI Mock Interview...")
    r = client.post("/interviews/start", json={
        "target_role": "Senior Backend Engineer",
        "interview_type": "Technical",
        "difficulty": "Senior",
        "total_questions": 3
    }, headers=headers)
    assert r.status_code == 200, f"Interview start failed: {r.text}"
    interview_res = r.json()
    session_id = interview_res["id"]
    first_q = interview_res["questions"][0]
    print(f"  [PASS] Interview Session Initialized: ID {session_id[:8]}...")
    print(f"    Question #1: \"{first_q['question_text']}\"")

    # 12. Submit Answer & Evaluation
    print("\n[12/13] Submitting simulated candidate response for evaluation...")
    candidate_answer = (
        "To manage concurrency in FastAPI and PostgreSQL, I configure async SQLAlchemy connection pools "
        "with appropriate pool_size and max_overflow limits. We use database transactions with optimistic "
        "locking via version columns or SELECT FOR UPDATE when updating critical state, avoiding deadlocks "
        "by enforcing strict resource acquisition ordering. Furthermore, we leverage Redis distributed locks "
        "with TTL for non-database shared resource coordination."
    )
    r = client.post(f"/interviews/{session_id}/answer", json={
        "transcript": candidate_answer,
        "duration_seconds": 65
    }, headers=headers)
    assert r.status_code == 200, f"Answer submission failed: {r.text}"
    answer_res = r.json()
    eval_q1 = answer_res["questions"][0]["evaluation"]
    assert eval_q1 is not None, "Evaluation was not generated!"
    print(f"  [PASS] Response evaluated successfully:")
    print(f"    - Overall Score: {eval_q1['overall_score']} / 10")
    print(f"    - Technical Accuracy: {eval_q1['technical_accuracy']} / 10")
    print(f"    - Depth: {eval_q1['depth']} / 10")
    print(f"    - Communication: {eval_q1['communication']} / 10")
    print(f"    - Strengths: {eval_q1['strengths']}")

    # 13. Progress Tracking Endpoint
    print("\n[13/13] Fetching aggregated user progress record...")
    r = client.get("/progress/", headers=headers)
    assert r.status_code == 200, f"Progress fetch failed: {r.text}"
    prog_res = r.json()
    print(f"  [PASS] Progress summary: {prog_res['plan_progress_percent']}% plan progress | {len(prog_res['strong_skills'])} strong skills | {len(prog_res['recent_interviews'])} recent sessions.")

    print("\n=========================================")
    print("ALL 13 SMOKE TESTS PASSED CLEANLY! (100%)")
    print("=========================================\n")

if __name__ == "__main__":
    run_smoke_test()
