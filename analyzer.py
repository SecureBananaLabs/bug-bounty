from typing import Dict, Any

class BountyAnalyzer:
    def __init__(self):
        self.priority_stack = ["Python", "FastAPI", "TypeScript", "Next.js", "React", "Node.js"]

    def evaluate(self, issue_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates the 'solve-ability' and priority of a detected issue.
        """
        # High priority if it matches the core stack
        stack_match = any(skill.lower() in issue_//data.get('description', '').lower() for skill in self.priority_stack)
        
        autonomy_score = 95 if stack_match else 70
        priority = "HIGH" if autonomy_score >= 90 else "MEDIUM"
        
        return {
            "priority": priority,
            "autonomy_score": autonomy_score,
            "recommendation": "Proceed to Fix" if priority == "HIGH" else "Review Manually"
        }
