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

DATA_DIR = Path(__file__).resolve().parent / "data"

# --- Page config ---
st.set_page_config(page_title="NichePilot", layout="wide", page_icon="🏠")

# --- Session state init ---
if "session_mgr" not in st.session_state:
    st.session_state.session_mgr = SessionManager()
if "messages" not in st.session_state:
    st.session_state.messages = []
if "active_niche" not in st.session_state:
    st.session_state.active_niche = None
if "session" not in st.session_state:
    st.session_state.session = None

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
            df_niche = df[df["niche"] == st.session_state.active_niche]
            if not df_niche.empty:
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
    # Display chat history
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

    # Chat input
    if user_input := st.chat_input("Type your message..."):
        # Display user message
        st.session_state.messages.append({"role": "user", "content": user_input})
        with st.chat_message("user"):
            st.markdown(user_input)

        # Get assistant response
        with st.chat_message("assistant"):
            response_placeholder = st.empty()
            status_placeholder = st.empty()
            full_response = ""

            for event in reply(st.session_state.session, config, user_input):
                if event["type"] == "text":
                    full_response += event["content"]
                    response_placeholder.markdown(full_response + "▌")
                elif event["type"] == "tool_status":
                    status_placeholder.caption(event["message"])
                elif event["type"] == "error":
                    full_response = event["content"]

            response_placeholder.markdown(full_response)
            status_placeholder.empty()

        st.session_state.messages.append(
            {"role": "assistant", "content": full_response}
        )
        st.rerun()
