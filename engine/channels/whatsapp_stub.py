"""
WhatsApp Cloud API webhook stub for NichePilot.

This is a documented skeleton — NOT a full implementation.
To complete this integration, you need:
1. A Meta Business Account with WhatsApp Cloud API access
2. A verified phone number and WhatsApp Business Account ID
3. WHATSAPP_VERIFY_TOKEN and WHATSAPP_ACCESS_TOKEN in .env

Architecture:
- GET  /webhook  → Verification challenge (Meta verifies your endpoint)
- POST /webhook  → Receives incoming messages, processes via engine, sends reply

References:
- https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
- https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
"""
import os
import logging
from fastapi import FastAPI, Request, Query, HTTPException

logger = logging.getLogger(__name__)

# In production, mount this as a sub-app or include these routes in api.py
app = FastAPI(title="NichePilot WhatsApp Webhook", version="0.1.0")

VERIFY_TOKEN = os.environ.get("WHATSAPP_VERIFY_TOKEN", "")


@app.get("/webhook")
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
) -> str:
    """
    Webhook verification endpoint.

    Meta sends a GET request with hub.mode, hub.verify_token, and hub.challenge.
    If the token matches, return the challenge string to confirm the webhook.
    """
    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        logger.info("WhatsApp webhook verified successfully.")
        return hub_challenge or ""
    raise HTTPException(status_code=403, detail="Verification failed")


@app.post("/webhook")
async def receive_message(request: Request) -> dict:
    """
    Receive incoming WhatsApp messages.

    TODO: Implement the following steps:
    1. Parse the incoming webhook payload (request.json())
    2. Extract sender phone number and message text
    3. Look up or create a session for this phone number
    4. Call engine.agent.reply(session, config, message)
    5. Send the response back via WhatsApp Cloud API
       POST https://graph.facebook.com/v17.0/{phone_number_id}/messages
       with Authorization: Bearer {WHATSAPP_ACCESS_TOKEN}
    6. Return {"status": "ok"}
    """
    # body = await request.json()
    # logger.info(f"Received WhatsApp webhook: {body}")

    # Example payload structure:
    # {
    #   "entry": [{
    #     "changes": [{
    #       "value": {
    #         "messages": [{
    #           "from": "971501234567",
    #           "text": {"body": "Hello!"},
    #           "type": "text"
    #         }]
    #       }
    #     }]
    #   }]
    # }

    return {"status": "ok"}
