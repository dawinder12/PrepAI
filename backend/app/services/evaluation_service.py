import re
from typing import Dict, Any, List
from app.services.llm_service import llm_service

class EvaluationService:
    @classmethod
    async def evaluate_answer(
        cls,
        question_text: str,
        expected_key_points: List[str],
        candidate_answer: str,
        category: str = "Technical",
        retrieved_context: str = ""
    ) -> Dict[str, Any]:
        # 1. Try Live LLM if configured
        if llm_service.is_configured():
            system_prompt = (
                "You are an expert technical interviewer evaluating a candidate's response. "
                "Assess the response objectively and return a structured JSON evaluation matching this schema:\n"
                "{\n"
                '  "overall_score": float (1.0 to 10.0),\n'
                '  "technical_accuracy": float (1.0 to 10.0),\n'
                '  "relevance": float (1.0 to 10.0),\n'
                '  "communication": float (1.0 to 10.0),\n'
                '  "depth": float (1.0 to 10.0),\n'
                '  "strengths": [string],\n'
                '  "improvements": [string],\n'
                '  "missing_points": [string],\n'
                '  "model_answer_highlights": string\n'
                "}"
            )
            user_prompt = (
                f"Question: {question_text}\n"
                f"Category: {category}\n"
                f"Key Points Expected: {', '.join(expected_key_points or [])}\n"
                f"Relevant Context: {retrieved_context}\n\n"
                f"Candidate Answer:\n{candidate_answer}"
            )
            llm_result = await llm_service.generate_json(system_prompt, user_prompt)
            if llm_result and isinstance(llm_result, dict) and "overall_score" in llm_result:
                return llm_result

        # 2. Dynamic Evaluation based on the candidate's actual answer content, key concepts, length, structure
        return cls._heuristic_evaluate(question_text, expected_key_points, candidate_answer, category)

    @classmethod
    def _heuristic_evaluate(
        cls,
        question_text: str,
        expected_key_points: List[str],
        candidate_answer: str,
        category: str
    ) -> Dict[str, Any]:
        ans_clean = candidate_answer.strip()
        ans_words = ans_clean.split()
        word_count = len(ans_words)
        ans_lower = ans_clean.lower()

        # If answer is empty or barely any words
        if word_count < 5:
            return {
                "overall_score": 2.0,
                "technical_accuracy": 2.0,
                "relevance": 2.0,
                "communication": 2.0,
                "depth": 2.0,
                "strengths": ["Attempted to respond to the prompt."],
                "improvements": ["Answer is too brief. Elaborate on your technical thought process and key principles."],
                "missing_points": expected_key_points or ["Core concept explanation", "Real-world trade-offs"],
                "model_answer_highlights": "Provide a comprehensive answer covering definitions, internal mechanics, and real-world implementation trade-offs."
            }

        # Analyze presence of expected key points
        matched_points = []
        missing_points = []
        for pt in expected_key_points:
            pt_tokens = [t.lower() for t in re.findall(r'\b\w{3,}\b', pt)]
            match_hits = sum(1 for t in pt_tokens if t in ans_lower)
            if pt_tokens and (match_hits / len(pt_tokens) >= 0.4):
                matched_points.append(pt)
            else:
                missing_points.append(pt)

        # Baseline scoring
        base_relevance = 6.5
        # If matches key words from question
        q_tokens = [t.lower() for t in re.findall(r'\b\w{4,}\b', question_text)]
        q_hits = sum(1 for t in q_tokens if t in ans_lower)
        relevance_score = min(9.5, max(4.0, base_relevance + (q_hits * 0.3)))

        # Depth score based on explanation length & trade-off words
        depth_score = 5.0
        if word_count > 30:
            depth_score += 1.5
        if word_count > 80:
            depth_score += 1.5
        if any(w in ans_lower for w in ["trade-off", "tradeoff", "latency", "scale", "concurrency", "bottleneck", "complexity", "because", "advantage"]):
            depth_score += 1.0
        depth_score = min(9.5, depth_score)

        # Communication score based on structure
        communication_score = 6.0
        if "." in ans_clean:
            communication_score += 1.0
        if any(w in ans_lower for w in ["first", "second", "specifically", "in addition", "for example"]):
            communication_score += 1.5
        communication_score = min(9.0, communication_score)

        # Technical accuracy
        tech_score = 5.5 + (len(matched_points) * 0.8) - (len(missing_points) * 0.4)
        tech_score = min(9.5, max(3.5, tech_score))

        overall_score = round((tech_score * 0.35 + relevance_score * 0.25 + communication_score * 0.20 + depth_score * 0.20), 1)
        tech_score = round(tech_score, 1)
        relevance_score = round(relevance_score, 1)
        communication_score = round(communication_score, 1)
        depth_score = round(depth_score, 1)

        strengths = []
        if matched_points:
            strengths.append(f"Successfully addressed key concepts: {', '.join(matched_points[:2])}.")
        if word_count >= 50:
            strengths.append("Provided detailed reasoning rather than a superficial one-sentence reply.")
        if any(w in ans_lower for w in ["for example", "specifically", "such as"]):
            strengths.append("Supported reasoning with practical examples.")
        if not strengths:
            strengths.append("Clear attempt to address the core question directly.")

        improvements = []
        if missing_points:
            improvements.append(f"Incorporate missing technical dimensions: {', '.join(missing_points[:2])}.")
        if depth_score < 7.0:
            improvements.append("Elaborate further on underlying architectural trade-offs and edge cases.")
        if communication_score < 7.0:
            improvements.append("Structure your answer using a clear framework (Concept -> Mechanism -> Practical Example).")
        if not improvements:
            improvements.append("Consider discussing production observability and failure recovery for even greater depth.")

        model_highlights = (
            f"A top-tier answer should clearly define the mechanism, discuss architectural trade-offs "
            f"({', '.join(missing_points[:2]) if missing_points else 'performance, reliability, scalability'}), "
            f"and illustrate with a concrete production scenario."
        )

        return {
            "overall_score": overall_score,
            "technical_accuracy": tech_score,
            "relevance": relevance_score,
            "communication": communication_score,
            "depth": depth_score,
            "strengths": strengths,
            "improvements": improvements,
            "missing_points": missing_points if missing_points else ["Production edge-case handling"],
            "model_answer_highlights": model_highlights
        }

evaluation_service = EvaluationService()
