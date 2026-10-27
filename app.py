"""NichePilot – Streamlit chat interface."""
import os
import pandas as pd
import streamlit as st
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

from engine.config_loader import load_niche, list_niches_with_catalog
from engine.session import SessionManager, Session
from engine.agent import reply
from engine.providers import get_active_provider_info
from engine.tools import mask_phone

DATA_DIR = Path(__file__).resolve().parent / "data"

# --- Page config ---
st.set_page_config(page_title="NichePilot", layout="wide", page_icon="🏠")

# --- Custom Styling for Demo (1280x720 recording) ---
st.markdown(
    """
    <style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .stDeployButton {display: none;}
    .block-container {
        padding-top: 1.2rem;
        padding-bottom: 0.5rem;
        padding-left: 2rem;
        padding-right: 2rem;
        max-width: 1280px;
    }
    div[data-testid="stChatMessage"] {
        padding-top: 0.35rem;
        padding-bottom: 0.35rem;
    }
    div[data-testid="stHorizontalBlock"] button {
        padding: 0.25rem 0.5rem;
        font-size: 0.82rem;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# --- Session state init ---
if "session_mgr" not in st.session_state:
    st.session_state.session_mgr = SessionManager()
if "messages" not in st.session_state:
    st.session_state.messages = []
if "active_niche" not in st.session_state:
    st.session_state.active_niche = None
if "session" not in st.session_state:
    st.session_state.session = None

# --- Toast notifications ---
if st.session_state.get("show_lead_toast"):
    st.toast("✅ Lead saved successfully!", icon="🎉")
    st.session_state.show_lead_toast = False

# --- Sidebar ---
with st.sidebar:
    st.title("⚙️ NichePilot")

    available_niches = list_niches_with_catalog()
    if not available_niches:
        st.error("No niches with catalog data found.")
        st.stop()

    selected_niche = st.selectbox(
        "Select Niche",
        available_niches,
        format_func=lambda x: x.replace("_", " ").title(),
    )

    # Handle niche change
    if selected_niche != st.session_state.active_niche:
        st.session_state.active_niche = selected_niche
        st.session_state.messages = []
        st.session_state.session = st.session_state.session_mgr.create_session(
            selected_niche
        )

    st.divider()

    # Provider info
    provider = get_active_provider_info()
    st.caption(f"🤖 Provider: **{provider.name}**")
    st.caption(f"📦 Model: `{provider.model}`")

    has_api_key = bool(os.environ.get("PRIMARY_API_KEY", "").strip())
    if not has_api_key:
        st.warning("⚠️ Add your API key in .env to start chatting")

    st.divider()

    if st.button("🔄 Reset Conversation", use_container_width=True):
        st.session_state.messages = []
        st.session_state.session = st.session_state.session_mgr.create_session(
            selected_niche
        )
        st.rerun()

# --- Load niche config ---
config = load_niche(st.session_state.active_niche)

# --- Ensure session exists ---
if st.session_state.session is None:
    st.session_state.session = st.session_state.session_mgr.create_session(
        st.session_state.active_niche
    )

# --- Main layout ---
st.title(f"{config.business_name} - AI Assistant")
st.caption("🏗️ Demo with sample data — all listings and information are fictional")

col1, col2 = st.columns([3, 1])

with col2:
    st.subheader("📋 Leads Captured")
    leads_path = DATA_DIR / "leads.csv"
    if leads_path.exists():
        try:
            df = pd.read_csv(leads_path)
            df_niche = df[df["niche"] == st.session_state.active_niche].copy()
            if not df_niche.empty:
                df_niche["phone"] = df_niche["phone"].astype(str).apply(mask_phone)
                st.dataframe(
                    df_niche[["name", "phone", "interest_summary"]].reset_index(
                        drop=True
                    ),
                    use_container_width=True,
                    hide_index=True,
                )
            else:
                st.info("No leads yet for this niche.")
        except Exception:
            st.info("No leads yet.")
    else:
        st.info("No leads captured yet.")

with col1:
    # 4 Demo Beats buttons above chat
    st.caption("💡 **Try asking (demo beats):**")
    b_cols = st.columns(4)
    demo_buttons = [
        b_cols[0].button("🔍 2BR Marina Rent", use_container_width=True, help="Property search"),
        b_cols[1].button("🎯 Buy a Villa", use_container_width=True, help="Qualifying flow"),
        b_cols[2].button("📋 Capture Lead", use_container_width=True, help="Save lead details"),
        b_cols[3].button("⚖️ Golden Visa", use_container_width=True, help="Out of scope -> handoff"),
    ]

    demo_texts = [
        "2-bedroom apartment in Dubai Marina to rent",
        "Hi, I'm looking to buy a property in Dubai",
        "My name is Sarah Connor and my phone is +971 50 123 4567",
        "Can you help me get a UAE golden visa?",
    ]

    prompt_to_send = None
    for clicked, query in zip(demo_buttons, demo_texts):
        if clicked:
            prompt_to_send = query

    # Display chat history
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])
            if msg.get("handed_off"):
                st.info("🤝 Conversation handed off to a human agent — our team will follow up shortly.")

    # Chat input
    has_api_key = bool(os.environ.get("PRIMARY_API_KEY", "").strip())
    chat_prompt = "Type your message..." if has_api_key else "Add your API key in .env to start chatting"
    user_input = st.chat_input(chat_prompt, disabled=not has_api_key)
    if user_input:
        prompt_to_send = user_input

    # Process prompt if sent
    if prompt_to_send:
        st.session_state.messages.append({"role": "user", "content": prompt_to_send})
        with st.chat_message("user"):
            st.markdown(prompt_to_send)

        with st.chat_message("assistant"):
            status_placeholder = st.empty()
            response_placeholder = st.empty()
            full_response = ""
            lead_saved = False
            handed_off = False

            for event in reply(st.session_state.session, config, prompt_to_send):
                if event["type"] == "text":
                    full_response += event["content"]
                    response_placeholder.markdown(full_response + "▌")
                elif event["type"] == "tool_status":
                    status_placeholder.caption(f"⚡ {event['message']}")
                    msg_lower = event["message"].lower()
                    if "lead saved" in msg_lower or "saving lead" in msg_lower:
                        lead_saved = True
                    if "human" in msg_lower or "handoff" in msg_lower:
                        handed_off = True
                elif event["type"] == "error":
                    full_response = event["content"]

            response_placeholder.markdown(full_response)
            status_placeholder.empty()

            for te in st.session_state.session.tool_events:
                if te.get("tool") == "save_lead":
                    lead_saved = True
                elif te.get("tool") == "handoff_to_human":
                    handed_off = True

            if handed_off:
                st.info("🤝 Conversation handed off to a human agent — our team will follow up shortly.")

            if lead_saved:
                st.session_state.show_lead_toast = True

        st.session_state.messages.append(
            {"role": "assistant", "content": full_response, "handed_off": handed_off}
        )
        st.rerun()
