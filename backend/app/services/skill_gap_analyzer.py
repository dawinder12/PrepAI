from typing import Dict, Any, List
from app.services.llm_service import llm_service

TECH_FAMILY_MAPPINGS = {
    "Docker": ["Kubernetes", "CI/CD", "Containerization"],
    "Kubernetes": ["Docker", "Helm", "Microservices"],
    "React": ["Next.js", "Vue.js", "TypeScript", "Redux"],
    "TypeScript": ["JavaScript", "React", "Node.js"],
    "Python": ["FastAPI", "Django", "Flask", "Pandas"],
    "FastAPI": ["Python", "Flask", "REST API", "Microservices"],
    "PostgreSQL": ["MySQL", "SQLAlchemy", "Database Indexing", "SQL"],
    "Redis": ["Caching", "Distributed Systems", "Memcached"],
    "AWS": ["Azure", "GCP", "Cloud Architecture", "DevOps"],
    "System Design": ["Distributed Systems", "Microservices", "Scalability", "Load Balancing"]
}

RECOMMENDED_TOPICS_BY_SKILL = {
    "System Design": ["Horizontal vs Vertical Scaling", "Load Balancing & Reverse Proxies", "Database Sharding & Replication", "CAP Theorem & Consistency Models", "Caching Strategies (Cache-Aside, Write-Through)"],
    "Redis": ["In-memory data structures (Hashes, Sorted Sets)", "Cache invalidation patterns", "Pub/Sub architecture", "Redis Sentinel & Clustering"],
    "Docker": ["Multi-stage Dockerfiles", "Container networking & port binding", "Docker Compose microservices orchestration", "Volume management & security best practices"],
    "Kubernetes": ["Pods, Deployments, and Services", "ConfigMaps & Secrets", "Ingress Controllers", "Horizontal Pod Autoscalers (HPA)"],
    "FastAPI": ["Dependency Injection in FastAPI", "Pydantic V2 Request/Response validation", "Async / Await concurrency", "Background tasks & OpenTelemetry integration"],
    "PostgreSQL": ["ACID transactions & Isolation levels", "B-Tree vs GIN indexing optimization", "Query plan analysis (EXPLAIN ANALYZE)", "Connection pooling with PgBouncer"],
    "Kafka": ["Topic partitions & Consumer Groups", "Offset management & At-least-once delivery", "Event sourcing architecture"],
    "AWS": ["IAM Roles & Least-Privilege policies", "VPC, Subnets & Security Groups", "ECS/EKS container deployments", "S3 & CloudFront static assets distribution"]
}

class SkillGapAnalyzer:
    @classmethod
    async def analyze(
        cls,
        candidate_skills: List[str],
        candidate_profile: Dict[str, Any],
        job_requirements: Dict[str, Any]
    ) -> Dict[str, Any]:
        # 1. Try Live LLM if configured
        if llm_service.is_configured():
            system_prompt = (
                "You are an expert technical interviewer and career coach. Compare the candidate's profile "
                "against the job requirements and identify skill matches, gaps, and preparation priorities.\n"
                "Return valid JSON matching this schema:\n"
                "{\n"
                '  "match_score": float (0-100),\n'
                '  "strong_matches": [string],\n'
                '  "partial_matches": [string],\n'
                '  "missing_skills": [\n'
                '    {"skill": string, "importance": "High"|"Medium"|"Low", "reason": string, "recommended_topics": [string]}\n'
                '  ],\n'
                '  "recommended_priorities": [string]\n'
                "}"
            )
            user_prompt = (
                f"Candidate Profile:\nSkills: {', '.join(candidate_skills)}\nSummary: {candidate_profile.get('summary', '')}\n\n"
                f"Job Requirements:\nRequired Skills: {', '.join(job_requirements.get('required_skills', []))}\n"
                f"Preferred Skills: {', '.join(job_requirements.get('preferred_skills', []))}\n"
                f"Role: {job_requirements.get('role_type', '')}"
            )
            llm_result = await llm_service.generate_json(system_prompt, user_prompt)
            if llm_result and isinstance(llm_result, dict) and "missing_skills" in llm_result:
                return llm_result

        # 2. Heuristic Analysis based on actual input data
        return cls._heuristic_analyze(candidate_skills, job_requirements)

    @classmethod
    def _heuristic_analyze(
        cls,
        candidate_skills: List[str],
        job_requirements: Dict[str, Any]
    ) -> Dict[str, Any]:
        cand_set = {s.lower() for s in candidate_skills}
        req_skills = job_requirements.get("required_skills", [])
        pref_skills = job_requirements.get("preferred_skills", [])
        all_job_skills = req_skills + [s for s in pref_skills if s not in req_skills]
        if not all_job_skills:
            all_job_skills = ["System Design", "Python", "FastAPI", "PostgreSQL", "Docker"]
            req_skills = ["System Design", "Python", "FastAPI"]

        strong_matches = []
        partial_matches = []
        missing_skills = []

        for skill in all_job_skills:
            skill_lower = skill.lower()
            if skill_lower in cand_set:
                strong_matches.append(skill)
            else:
                # Check for family relations
                related = TECH_FAMILY_MAPPINGS.get(skill, [])
                has_related = any(r.lower() in cand_set for r in related)
                if has_related:
                    partial_matches.append(skill)
                else:
                    importance = "High" if skill in req_skills else "Medium"
                    reason = (
                        f"Crucial for the core responsibilities of this {job_requirements.get('role_type', 'target')} role."
                        if importance == "High"
                        else "Desirable skill that provides a competitive edge in technical discussions."
                    )
                    recommended = RECOMMENDED_TOPICS_BY_SKILL.get(
                        skill,
                        [f"Core architecture of {skill}", f"Production best practices for {skill}", f"Common interview trade-offs with {skill}"]
                    )
                    missing_skills.append({
                        "skill": skill,
                        "importance": importance,
                        "reason": reason,
                        "recommended_topics": recommended
                    })

        # Calculate mathematical match score
        total_eval = len(all_job_skills)
        if total_eval == 0:
            match_score = 50.0
        else:
            score_points = (len(strong_matches) * 1.0) + (len(partial_matches) * 0.5)
            match_score = round(min(100.0, max(10.0, (score_points / total_eval) * 100.0)), 1)

        # Generate recommended priorities
        priorities = []
        for m in missing_skills:
            if m["importance"] == "High":
                priorities.append(f"Master {m['skill']} fundamentals & architectural trade-offs")
        for p in partial_matches:
            priorities.append(f"Deepen knowledge in {p} to bridge partial match gap")
        if not priorities:
            priorities = ["Solidify System Design principles", "Practice end-to-end coding problems", "Review behavioral STAR methodology responses"]

        return {
            "match_score": match_score,
            "strong_matches": strong_matches,
            "partial_matches": partial_matches,
            "missing_skills": missing_skills,
            "recommended_priorities": priorities[:4]
        }

skill_gap_analyzer = SkillGapAnalyzer()
