from typing import Dict, Any, List
from app.services.llm_service import llm_service

class PlanGenerator:
    @classmethod
    async def generate_plan(
        cls,
        target_role: str,
        duration_weeks: int,
        strong_skills: List[str],
        missing_skills: List[Dict[str, Any]],
        focus_areas: List[str] = None
    ) -> Dict[str, Any]:
        # 1. Try Live LLM if configured
        if llm_service.is_configured():
            system_prompt = (
                "You are an expert technical interview coach. Generate a personalized preparation roadmap "
                "for the candidate based on target role, missing skills, and duration in weeks.\n"
                "Return valid JSON matching this schema:\n"
                "{\n"
                '  "overview": string,\n'
                '  "topics": [\n'
                '    {\n'
                '      "week_number": int,\n'
                '      "order_index": int,\n'
                '      "title": string,\n'
                '      "category": string,\n'
                '      "description": string,\n'
                '      "key_concepts": [string],\n'
                '      "recommended_resources": [string]\n'
                '    }\n'
                '  ]\n'
                "}"
            )
            missing_names = [m.get("skill") for m in missing_skills if isinstance(m, dict)]
            user_prompt = (
                f"Target Role: {target_role}\n"
                f"Weeks: {duration_weeks}\n"
                f"Strengths: {', '.join(strong_skills)}\n"
                f"Missing Skills to Bridge: {', '.join(missing_names)}\n"
                f"Focus Areas: {', '.join(focus_areas or [])}"
            )
            llm_result = await llm_service.generate_json(system_prompt, user_prompt)
            if llm_result and isinstance(llm_result, dict) and "topics" in llm_result:
                return llm_result

        # 2. Heuristic Plan Generation tailored dynamically to the candidate's actual missing skills and strengths
        return cls._heuristic_plan(target_role, duration_weeks, strong_skills, missing_skills)

    @classmethod
    def _heuristic_plan(
        cls,
        target_role: str,
        duration_weeks: int,
        strong_skills: List[str],
        missing_skills: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        missing_names = [m.get("skill") if isinstance(m, dict) else str(m) for m in missing_skills]
        if not missing_names:
            missing_names = ["System Design", "Distributed Caching", "API Resilience"]

        overview = (
            f"Tailored {duration_weeks}-week roadmap for {target_role}. This curriculum focuses on bridging key gaps "
            f"({', '.join(missing_names[:3])}) while reinforcing your core competencies in {', '.join(strong_skills[:3]) if strong_skills else 'software engineering'}."
        )

        topics = []
        order = 1
        
        # Week 1: Core Fundamentals & Gaps
        primary_gap = missing_names[0] if missing_names else "Core Architecture"
        topics.append({
            "week_number": 1,
            "order_index": order,
            "title": f"{primary_gap} Foundations & Core Patterns",
            "category": "Fundamentals",
            "description": f"Master the fundamental architecture, standard idioms, and common trade-offs of {primary_gap}.",
            "key_concepts": ["Internal architecture", "Memory & Concurrency model", "Idiomatic error handling", "Common interview traps"],
            "recommended_resources": ["Official Documentation", "Production Engineering Case Studies", "Interactive Coding Exercises"]
        })
        order += 1

        topics.append({
            "week_number": 1,
            "order_index": order,
            "title": "API Design & Concurrency Best Practices",
            "category": "Backend",
            "description": "Idempotency, RESTful status codes, pagination, rate limiting, and async execution paradigms.",
            "key_concepts": ["Idempotency Keys", "Cursor-based pagination", "Asynchronous task execution", "Connection pooling"],
            "recommended_resources": ["REST API Design Best Practices", "Martin Fowler Architecture Guides"]
        })
        order += 1

        # Week 2: Distributed Systems / Databases
        secondary_gap = missing_names[1] if len(missing_names) > 1 else "PostgreSQL & Database Optimization"
        topics.append({
            "week_number": 2,
            "order_index": order,
            "title": f"Data Persistence & {secondary_gap}",
            "category": "Data & Caching",
            "description": f"Deep dive into indexing, replication, consistency models, and caching strategies with {secondary_gap}.",
            "key_concepts": ["B-Tree & Hash indexes", "Transaction Isolation Levels (Read Committed vs Serializable)", "Cache-aside vs Write-through", "Sharding & Partitioning"],
            "recommended_resources": ["Designing Data-Intensive Applications (Kleppmann)", "PostgreSQL EXPLAIN ANALYZE Deep Dive"]
        })
        order += 1

        # Week 3: High-Level System Design & Scaling
        topics.append({
            "week_number": 3,
            "order_index": order,
            "title": "Scalable System Design & Architecture",
            "category": "System Design",
            "description": "Design high-scale distributed systems under real constraints (availability, latency, cost).",
            "key_concepts": ["Load Balancing strategies", "CAP theorem & PACELC", "Event-driven architecture with Kafka", "Microservice failure handling (Circuit Breakers)"],
            "recommended_resources": ["System Design Primer (GitHub)", "High Scalability Real-World Architectures"]
        })
        order += 1

        # Week 4: Mock Interviews & Behavioral Mastery
        topics.append({
            "week_number": 4,
            "order_index": order,
            "title": "Live Mock Interview Drills & Behavioral Framing",
            "category": "Interview Practice",
            "description": "Simulate technical deep dives, live code walkthroughs, and behavioral STAR scenario questions.",
            "key_concepts": ["STAR behavioral methodology", "Thinking aloud during architectural trade-offs", "Clarifying edge cases upfront", "Graceful handling of unknowns"],
            "recommended_resources": ["PrepAI AI Mock Interview System", "Cracking the Coding Interview"]
        })

        return {
            "overview": overview,
            "topics": topics
        }

plan_generator = PlanGenerator()
