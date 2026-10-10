import re
from typing import Dict, Any, List
from app.services.llm_service import llm_service
from app.services.resume_parser import KNOWN_TECH_SKILLS

class JobAnalyzer:
    @classmethod
    async def analyze_job(cls, raw_text: str, title: str = "") -> Dict[str, Any]:
        # 1. Live LLM if configured
        if llm_service.is_configured():
            system_prompt = (
                "You are an expert technical recruiter and talent analyzer. Analyze the job description and extract "
                "structured requirements in valid JSON matching this schema:\n"
                "{\n"
                '  "role_type": string,\n'
                '  "domain": string,\n'
                '  "seniority": string,\n'
                '  "required_skills": [string],\n'
                '  "preferred_skills": [string],\n'
                '  "technologies": [string],\n'
                '  "responsibilities": [string],\n'
                '  "experience_requirements": string\n'
                "}"
            )
            llm_result = await llm_service.generate_json(system_prompt, f"Job Title: {title}\n\nJob Description:\n{raw_text[:7000]}")
            if llm_result and isinstance(llm_result, dict) and "required_skills" in llm_result:
                return llm_result

        # 2. Heuristic rule-based analyzer on the actual text
        return cls._heuristic_analyze(raw_text, title)

    @classmethod
    def _heuristic_analyze(cls, raw_text: str, title: str = "") -> Dict[str, Any]:
        raw_lower = raw_text.lower()
        title_lower = title.lower()
        
        # Seniority detection
        seniority = "Mid-Level"
        if any(w in title_lower or w in raw_lower for w in ["junior", "entry level", "associate", "intern"]):
            seniority = "Junior"
        elif any(w in title_lower or w in raw_lower for w in ["senior", "sr.", "staff", "principal"]):
            seniority = "Senior"
        elif any(w in title_lower or w in raw_lower for w in ["lead", "manager", "director", "head of"]):
            seniority = "Lead"

        # Domain & Role type
        domain = "Software Engineering"
        role_type = "Full Stack Engineer"
        if "backend" in title_lower or "backend" in raw_lower:
            role_type = "Backend Engineer"
            domain = "Backend Development & Distributed Systems"
        elif "frontend" in title_lower or "frontend" in raw_lower:
            role_type = "Frontend Engineer"
            domain = "Frontend Development & UI Engineering"
        elif "machine learning" in title_lower or "ai" in title_lower or "data science" in title_lower:
            role_type = "AI/ML Engineer"
            domain = "Artificial Intelligence & Data Science"
        elif "devops" in title_lower or "cloud" in title_lower or "sre" in title_lower:
            role_type = "DevOps / Platform Engineer"
            domain = "Cloud Infrastructure & Site Reliability"

        # Skills found in JD text
        matched_skills = []
        for skill in KNOWN_TECH_SKILLS:
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, raw_lower):
                matched_skills.append(skill)

        # Distribute into required vs preferred based on contextual cues
        required = []
        preferred = []
        
        req_section = False
        pref_section = False
        
        for line in raw_text.splitlines():
            l_lower = line.strip().lower()
            if any(k in l_lower for k in ["requirements", "what you need", "must have", "qualifications", "required skills"]):
                req_section = True
                pref_section = False
            elif any(k in l_lower for k in ["nice to have", "preferred", "bonus", "plus", "desired"]):
                pref_section = True
                req_section = False
            
            for s in matched_skills:
                if re.search(r'\b' + re.escape(s.lower()) + r'\b', l_lower):
                    if pref_section and s not in preferred:
                        preferred.append(s)
                    elif req_section and s not in required:
                        required.append(s)

        # If sections weren't explicitly found, take top 60% as required, rest as preferred
        if not required and matched_skills:
            split_point = max(1, int(len(matched_skills) * 0.65))
            required = matched_skills[:split_point]
            preferred = matched_skills[split_point:]

        # Responsibilities
        responsibilities = []
        for line in raw_text.splitlines():
            line_str = line.strip()
            if (line_str.startswith("•") or line_str.startswith("-") or line_str.startswith("*")) and len(line_str) > 20:
                responsibilities.append(line_str.lstrip("•-* ").strip())
                if len(responsibilities) >= 5:
                    break

        if not responsibilities:
            responsibilities = [
                f"Design, build, and maintain production features for the {title or 'engineering'} team.",
                "Collaborate cross-functionally with product managers and engineers.",
                "Ensure code quality, test coverage, and high availability."
            ]

        # Experience requirements
        exp_match = re.search(r'(\d+\+?\s*(?:to\s*\d+)?\s*(?:years|yrs)\b[^\.\n]*)', raw_lower)
        exp_req = exp_match.group(1).title() if exp_match else "3+ years of relevant industry experience"

        return {
            "role_type": role_type,
            "domain": domain,
            "seniority": seniority,
            "required_skills": required,
            "preferred_skills": preferred,
            "technologies": matched_skills,
            "responsibilities": responsibilities,
            "experience_requirements": exp_req
        }

job_analyzer = JobAnalyzer()
