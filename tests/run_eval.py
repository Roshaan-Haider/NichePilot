"""Run test questions against the engine and print replies for manual review."""
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv
load_dotenv()

from engine.config_loader import load_niche
from engine.session import SessionManager
from engine.agent import reply


def main() -> None:
    """Run all test questions and print results."""
    questions_file = Path(__file__).parent / "test_questions.txt"
    if not questions_file.exists():
        print("test_questions.txt not found!")
        return
    
    questions = [q.strip() for q in questions_file.read_text().splitlines() if q.strip()]
    config = load_niche("real_estate")
    session_mgr = SessionManager()
    
    print(f"Running {len(questions)} test questions against '{config.business_name}'")
    print("=" * 80)
    
    for i, question in enumerate(questions, 1):
        # Each question gets a fresh session
        session = session_mgr.create_session("real_estate")
        
        print(f"\n[{i}/{len(questions)}] USER: {question}")
        print("-" * 60)
        
        full_response = ""
        tool_events = []
        
        for event in reply(session, config, question):
            if event["type"] == "text":
                full_response += event["content"]
            elif event["type"] == "tool_status":
                tool_events.append(event["message"])
            elif event["type"] == "error":
                full_response = event["content"]
        
        if tool_events:
            print(f"  TOOLS: {' | '.join(tool_events)}")
        print(f"  ASSISTANT: {full_response}")
        print("-" * 60)
    
    print("\n" + "=" * 80)
    print("Evaluation complete. Review the responses above manually.")


if __name__ == "__main__":
    main()
