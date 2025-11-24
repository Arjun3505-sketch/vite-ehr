import os
import time
import threading
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client, Client

# --- 1. LOAD ENV VARIABLES ---
# We must load .env BEFORE importing modules that use the keys
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
dotenv_path = os.path.join(root_dir, ".env")

if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)
    print(f"✅ Loaded environment variables from: {dotenv_path}")
else:
    print("⚠️ .env file not found. Ensure keys are set.")

# --- 2. IMPORT LOGIC MODULES ---
# Import this AFTER load_dotenv so it sees the keys
try:
    from chatbot_logic import chatbot_with_data
except ImportError:
    print("⚠️ Could not import chatbot_logic. Ensure chatbot_logic.py exists.")

    def chatbot_with_data(*args, **kwargs):
        return "AI Logic Not Loaded"


app = Flask(__name__)
CORS(app)

# --- 3. INITIALIZE CREDENTIALS ---
# Check for all possible names for the keys
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = (
    os.getenv("SUPABASE_KEY")
    or os.getenv("VITE_SUPABASE_ANON_KEY")
    or os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")
)

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

# Initialize Supabase
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Supabase connected successfully")
    except Exception as e:
        print(f"❌ Failed to initialize Supabase: {e}")
else:
    print("⚠️ CRITICAL: Supabase keys missing in .env")


# --- 4. DATA FETCHING HELPER ---
def get_patient_medical_data(patient_id):
    """Fetches diagnoses, prescriptions, reports, surgeries, and vaccinations for a patient"""
    if not supabase:
        return None

    try:
        # Check if patient exists
        patient = (
            supabase.table("patients").select("name").eq("id", patient_id).execute()
        )
        if not patient.data:
            return None

        # Fetch all records
        diagnoses = (
            supabase.table("diagnoses")
            .select("*")
            .eq("patient_id", patient_id)
            .order("date", desc=True)
            .execute()
        )
        prescriptions = (
            supabase.table("prescriptions")
            .select("*")
            .eq("patient_id", patient_id)
            .order("created_at", desc=True)
            .execute()
        )

        lab_reports = []
        try:
            reports_res = (
                supabase.table("lab_reports")
                .select("*")
                .eq("patient_id", patient_id)
                .order("date", desc=True)
                .execute()
            )
            lab_reports = reports_res.data
        except:
            pass

        surgeries = []
        try:
            surgeries_res = (
                supabase.table("surgeries")
                .select("*")
                .eq("patient_id", patient_id)
                .order("date", desc=True)
                .execute()
            )
            surgeries = surgeries_res.data
            print(f"🔍 Fetched {len(surgeries)} surgeries for patient {patient_id}")
            print(f"🔍 Surgeries data: {surgeries}")
        except Exception as e:
            print(f"❌ Error fetching surgeries: {e}")
            pass

        vaccinations = []
        try:
            vaccinations_res = (
                supabase.table("vaccinations")
                .select("*")
                .eq("patient_id", patient_id)
                .order("date", desc=True)
                .execute()
            )
            vaccinations = vaccinations_res.data
        except:
            pass

        return {
            "patient_name": patient.data[0]["name"],
            "diagnoses": diagnoses.data,
            "prescriptions": prescriptions.data,
            "lab_reports": lab_reports,
            "surgeries": surgeries,
            "vaccinations": vaccinations,
        }
    except Exception as e:
        print(f"Error fetching data: {e}")
        return None


# --- 5. TELEGRAM BOT LOGIC ---
BOT_SESSIONS = {}


def handle_telegram_message(chat_id, text):
    text = text.strip()

    # A. HANDLE START COMMAND (Prevents UUID Error)
    if text == "/start":
        return "👋 **Welcome to CarePath AI!**\n\nPlease paste your **Patient UUID** to log in and access your records."

    # B. LOGOUT
    if text.lower() == "/logout":
        if chat_id in BOT_SESSIONS:
            del BOT_SESSIONS[chat_id]
            return "🔒 Logged out. Enter a Patient ID to log in."
        return "You are not logged in."

    # C. LOGIN FLOW (If not authenticated)
    if chat_id not in BOT_SESSIONS:
        # Validate format to avoid DB errors (UUIDs are 36 chars)
        if len(text) != 36:
            return "❌ **Invalid Format.**\nA valid Patient ID is a 36-character UUID.\nExample: `a1b2c3d4-e5f6-...`"

        # Check if text is a valid Patient ID in DB
        data = get_patient_medical_data(text)
        if data:
            BOT_SESSIONS[chat_id] = text
            return f"✅ **Welcome, {data['patient_name']}!**\n\nRecords loaded. Ask me about your diagnoses or medicines."
        else:
            return "❌ **Patient Not Found.**\n\nPlease paste a valid **Patient UUID**."

    # D. CHAT FLOW (Authenticated)
    patient_id = BOT_SESSIONS[chat_id]
    data = get_patient_medical_data(patient_id)

    if not data:
        return "⚠️ Error retrieving data. Please try logging in again."

    # Send "Typing..." indicator
    if TELEGRAM_BOT_TOKEN:
        try:
            requests.post(
                f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendChatAction",
                json={"chat_id": chat_id, "action": "typing"},
                timeout=5,
            )
        except:
            pass

    # Get Answer from Gemini
    response = chatbot_with_data(
        patient_id=patient_id,
        user_input=text,
        diagnoses_data=data["diagnoses"],
        prescriptions_data=data["prescriptions"],
        lab_reports_data=data["lab_reports"],
    )
    return response


def run_telegram_bot():
    """Background thread to listen for Telegram messages"""
    if not TELEGRAM_BOT_TOKEN:
        print("⚠️ No Telegram Token found. Bot disabled.")
        return

    print("🤖 Telegram Bot Listener Started...")
    offset = 0
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"

    while True:
        try:
            # Long polling for updates
            response = requests.get(
                f"{url}/getUpdates?offset={offset}&timeout=30", timeout=35
            )

            if response.status_code == 200:
                updates = response.json().get("result", [])
                for update in updates:
                    offset = update["update_id"] + 1
                    if "message" in update and "text" in update["message"]:
                        chat_id = update["message"]["chat"]["id"]
                        text = update["message"]["text"]

                        # Generate Reply
                        reply = handle_telegram_message(chat_id, text)

                        # Send Reply
                        requests.post(
                            f"{url}/sendMessage",
                            json={
                                "chat_id": chat_id,
                                "text": reply,
                                "parse_mode": "Markdown",
                            },
                            timeout=10,
                        )
            else:
                print(f"Telegram API Error: {response.status_code}")
                time.sleep(5)

        except requests.exceptions.RequestException as e:
            print(f"Bot Connection Error: {e}")
            time.sleep(10)  # Wait longer on connection failure
        except Exception as e:
            print(f"Bot Unexpected Error: {e}")
            time.sleep(5)


# --- 6. API ROUTES ---


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy"}), 200


@app.route("/send-notification", methods=["POST"])
def send_notification():
    """Endpoint for Frontend to trigger notifications"""
    data = request.get_json()
    msg = data.get("message")

    if msg and TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID:
        try:
            requests.post(
                f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
                json={
                    "chat_id": TELEGRAM_CHAT_ID,
                    "text": f"🏥 *Alert*\n{msg}",
                    "parse_mode": "Markdown",
                },
                timeout=5,
            )
            return jsonify({"success": True}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return jsonify({"error": "Missing config or message"}), 400


@app.route("/fetch", methods=["POST"])
def fetch():
    data = request.get_json()
    res = get_patient_medical_data(data.get("patient_id"))
    if res:
        return jsonify({"success": True, **res}), 200
    return jsonify({"error": "Not found"}), 404


@app.route("/chat_with_data", methods=["POST"])
def chat():
    data = request.get_json()
    resp = chatbot_with_data(
        data.get("patient_id"),
        data.get("message"),
        data.get("diagnoses"),
        data.get("prescriptions"),
        data.get("lab_reports"),
        data.get("surgeries"),
        data.get("vaccinations"),
    )
    return jsonify({"success": True, "response": resp}), 200


if __name__ == "__main__":
    # Start Bot in Background
    if TELEGRAM_BOT_TOKEN:
        t = threading.Thread(target=run_telegram_bot, daemon=True)
        t.start()

    port = int(os.getenv("PORT", 5000))
    print(f"🚀 Server running on port {port}")
    app.run(debug=True, host="0.0.0.0", port=port, use_reloader=False)
