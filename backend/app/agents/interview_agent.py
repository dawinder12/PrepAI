from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, START, END
from app.services.llm_service import llm_service
from app.services.evaluation_service import evaluation_service

class InterviewState(TypedDict):
    candidate_profile: Dict[str, Any]
    job_requirements: Dict[str, Any]
    interview_type: str
    difficulty: str
    total_questions: int
    question_number: int
    retrieved_context: str
    current_question: Dict[str, Any]
    candidate_answer: str
    current_evaluation: Dict[str, Any]
    interview_history: List[Dict[str, Any]]
    weak_topics: List[str]
    strong_topics: List[str]
    final_score: Optional[float]
    is_complete: bool

class InterviewWorkflow:
    def __init__(self):
        self.graph = self._build_graph()

    def _build_graph(self):
        builder = StateGraph(InterviewState)

        # Register nodes
        builder.add_node("determine_context", self._determine_context)
        builder.add_node("retrieve_knowledge", self._retrieve_knowledge)
        builder.add_node("generate_question", self._generate_question)
        builder.add_node("evaluate_answer", self._evaluate_answer)
        builder.add_node("update_state", self._update_state)
        builder.add_node("finalize_interview", self._finalize_interview)

        # Define graph flow
        builder.add_edge(START, "determine_context")
        builder.add_edge("determine_context", "retrieve_knowledge")
        builder.add_edge("retrieve_knowledge", "generate_question")

        # Routing logic
        return builder.compile()

    async def _determine_context(self, state: InterviewState) -> Dict[str, Any]:
        """Examines candidate profile and target job to calibrate interview expectations."""
        target_role = state.get("job_requirements", {}).get("role_type") or "Software Engineer"
        difficulty = state.get("difficulty", "Mid")
        return {
            "retrieved_context": f"Targeting {target_role} at {difficulty} level. Emphasize production reliability, concurrency, and architecture."
        }

    async def _retrieve_knowledge(self, state: InterviewState) -> Dict[str, Any]:
        """Simulates domain knowledge retrieval and topic prioritization."""
        skills = state.get("job_requirements", {}).get("required_skills", [])
        q_num = state.get("question_number", 1)
        selected_topic = skills[(q_num - 1) % len(skills)] if skills else "System Architecture"
        context = f"Topic Domain: {selected_topic}. Candidates should demonstrate deep understanding of real-world trade-offs."
        return {"retrieved_context": context}

    async def _generate_question(self, state: InterviewState) -> Dict[str, Any]:
        """Dynamically generates interview question based on state, weak topics, and difficulty."""
        q_num = state.get("question_number", 1)
        int_type = state.get("interview_type", "Technical")
        difficulty = state.get("difficulty", "Mid")
        skills = state.get("job_requirements", {}).get("required_skills", [])
        topic = skills[(q_num - 1) % len(skills)] if skills else "Distributed Systems"
        weak_topics = state.get("weak_topics", [])

        # If previous answers revealed a weak topic, adapt and probe it
        if weak_topics and q_num > 2 and (q_num % 2 == 0):
            topic = weak_topics[-1]

        # 1. Live LLM Generation if configured
        if llm_service.is_configured():
            history = state.get("interview_history", [])
            last_turn = history[-1] if history else None
            last_q_text = last_turn["question"].get("question_text", "") if last_turn else ""
            last_ans_text = last_turn.get("answer", "") if last_turn else ""

            system_prompt = (
                "You are Alex, an expert Lead Technical Interviewer conducting a realistic, live 1-on-1 conversational mock interview call. "
                "Speak conversationally like an experienced human interviewer. "
                "If the candidate provided an answer to a previous question, briefly acknowledge their specific technical points in 1 natural sentence, "
                "then ask a thoughtful follow-up question or dive deeper into real-world trade-offs, edge cases, and architectures.\n"
                "Return valid JSON matching:\n"
                "{\n"
                '  "question_text": string,\n'
                '  "category": string,\n'
                '  "difficulty": string,\n'
                '  "expected_key_points": [string]\n'
                "}"
            )
            user_prompt = (
                f"Interview Round Turn #{q_num} of {state.get('total_questions', 4)}\n"
                f"Track: {int_type}, Difficulty Level: {difficulty}\n"
                f"Topic Focus: {topic}\n"
                f"Target Role: {state.get('job_requirements', {}).get('role_type', 'Software Engineer')}\n"
                + (f"Candidate's previous answer: \"{last_ans_text}\"\nPrevious question was: \"{last_q_text}\"\n" if last_ans_text else "This is the opening question of the call. Greet the candidate warmly and introduce the first technical topic.\n")
                + "Deliver the question naturally as Alex."
            )
            llm_result = await llm_service.generate_json(system_prompt, user_prompt)
            if llm_result and "question_text" in llm_result:
                return {"current_question": llm_result}

        # 2. Dynamic question generation engine tailored to role & topic
        generated = self._dynamic_question_factory(topic, int_type, difficulty, q_num)
        return {"current_question": generated}

    def _dynamic_question_factory(self, topic: str, int_type: str, difficulty: str, q_num: int) -> Dict[str, Any]:
        if int_type == "Behavioral":
            questions = [
                {
                    "question_text": f"Welcome to the session! To kick things off, tell me about a time you had a technical disagreement with a teammate or senior engineer. How did you navigate the discussion and what was the outcome?",
                    "category": "Behavioral / Conflict Resolution",
                    "expected_key_points": ["Objective data-driven discussion", "Active listening & empathy", "Deciding on metrics/trade-offs", "Disagree and commit"]
                },
                {
                    "question_text": "Thanks for sharing that. Now let's talk about ownership: describe a production outage or critical bug you were responsible for or stepped in to triage under tight pressure.",
                    "category": "Behavioral / Incident Management",
                    "expected_key_points": ["Fast triage and rollback/mitigation", "Root cause analysis (RCA)", "Blameless post-mortem", "Preventative automated testing"]
                },
                {
                    "question_text": "Understood. When business scope exceeds engineering sprint capacity, how do you personally prioritize competing deadlines and communicate with stakeholders?",
                    "category": "Behavioral / Prioritization",
                    "expected_key_points": ["Stakeholder communication", "De-scoping non-critical paths", "MVP delivery", "Tech debt tracking"]
                }
            ]
            selected = questions[(q_num - 1) % len(questions)]
        elif int_type == "System Design":
            questions = [
                {
                    "question_text": f"Hi there, let's dive into system design! How would you design a distributed rate limiter for high-throughput API endpoints utilizing {topic if topic in ['Redis', 'PostgreSQL'] else 'Redis'}?",
                    "category": "System Design",
                    "expected_key_points": ["Token Bucket or Sliding Window Log algorithm", "Atomic operations / Redis Lua scripts", "Handling race conditions in distributed nodes", "Graceful fallback if cache is down"]
                },
                {
                    "question_text": f"That's a solid start. Let's push this further: how would you design a resilient notification system that delivers millions of push and email messages with at-least-once delivery guarantees and failure recovery?",
                    "category": "System Design",
                    "expected_key_points": ["Message broker (Kafka/RabbitMQ)", "Worker queues & idempotency keys", "Dead letter queues (DLQ)", "Rate limiting downstream third-party APIs"]
                },
                {
                    "question_text": "Building on that architecture, what happens when downstream third-party email providers start throttling or failing? How do you prevent cascade failures across your microservices?",
                    "category": "System Design",
                    "expected_key_points": ["Circuit breaker pattern", "Backpressure handling", "Exponential backoff with jitter", "Dead-letter queues"]
                }
            ]
            selected = questions[(q_num - 1) % len(questions)]
        else: # Technical
            questions = [
                {
                    "question_text": f"Welcome! Let's start with technical foundations in {topic}: how do you handle concurrency, connection pooling, and prevent race conditions or resource starvation under heavy load?",
                    "category": f"Technical / {topic}",
                    "expected_key_points": ["Async I/O vs multi-threading", "Connection pool sizing & lifecycle", "Locking mechanisms (optimistic vs pessimistic)", "Idempotency & transaction boundaries"]
                },
                {
                    "question_text": f"Good explanation. Following up on that: can you walk me through the internal architecture and typical performance bottlenecks you encounter when scaling {topic} in production?",
                    "category": f"Technical / {topic}",
                    "expected_key_points": ["Memory management & query indexing", "Serialization overhead", "Network round trips & latency", "Monitoring & profiling tools"]
                },
                {
                    "question_text": f"Makes sense. When scaling an application utilizing {topic}, what caching and data partitioning strategies do you consider first, and what trade-offs do they introduce?",
                    "category": f"Technical / {topic}",
                    "expected_key_points": ["Cache invalidation strategies (Cache-aside vs Write-through)", "Cache stampede / thundering herd mitigation", "Sharding keys & data skew", "Eventual consistency vs strong consistency"]
                },
                {
                    "question_text": f"To wrap up our technical discussion: walk me through how you would monitor and debug an unexpected 99th-percentile latency spike in this system under peak traffic.",
                    "category": f"Technical / Observability",
                    "expected_key_points": ["Distributed tracing (OpenTelemetry/Jaeger)", "APM profiling & database slow query logs", "CPU/Memory saturation analysis", "Mitigation & canary rollouts"]
                }
            ]
            selected = questions[(q_num - 1) % len(questions)]

        selected["difficulty"] = difficulty
        return selected

    async def evaluate_and_progress(
        self,
        current_state: InterviewState,
        candidate_answer: str
    ) -> Dict[str, Any]:
        """Evaluates candidate answer and updates state."""
        q = current_state.get("current_question", {})
        evaluation = await evaluation_service.evaluate_answer(
            question_text=q.get("question_text", ""),
            expected_key_points=q.get("expected_key_points", []),
            candidate_answer=candidate_answer,
            category=q.get("category", "Technical")
        )

        # Update history
        history = list(current_state.get("interview_history", []))
        history.append({
            "question": q,
            "answer": candidate_answer,
            "evaluation": evaluation
        })

        # Update weak and strong topics
        score = evaluation.get("overall_score", 5.0)
        weak_topics = list(current_state.get("weak_topics", []))
        strong_topics = list(current_state.get("strong_topics", []))
        category = q.get("category", "Technical")
        
        if score < 6.5:
            if category not in weak_topics:
                weak_topics.append(category)
        else:
            if category not in strong_topics:
                strong_topics.append(category)

        next_q_num = current_state.get("question_number", 1) + 1
        is_complete = next_q_num > current_state.get("total_questions", 5)

        avg_score = round(sum(h["evaluation"]["overall_score"] for h in history) / len(history), 1)

        updated_state = {
            **current_state,
            "candidate_answer": candidate_answer,
            "current_evaluation": evaluation,
            "interview_history": history,
            "weak_topics": weak_topics,
            "strong_topics": strong_topics,
            "question_number": next_q_num,
            "is_complete": is_complete,
            "final_score": avg_score if is_complete else None
        }

        # If not complete, generate next question
        if not is_complete:
            next_q_res = await self._generate_question(updated_state)
            updated_state["current_question"] = next_q_res["current_question"]

        return updated_state

    async def _update_state(self, state: InterviewState) -> Dict[str, Any]:
        return state

    async def _evaluate_answer(self, state: InterviewState) -> Dict[str, Any]:
        return state

    async def _finalize_interview(self, state: InterviewState) -> Dict[str, Any]:
        history = state.get("interview_history", [])
        avg = round(sum(h["evaluation"]["overall_score"] for h in history) / len(history), 1) if history else 0.0
        return {
            "is_complete": True,
            "final_score": avg
        }

interview_workflow = InterviewWorkflow()
