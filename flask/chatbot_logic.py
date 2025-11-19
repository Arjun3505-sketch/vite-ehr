import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables if not already loaded
load_dotenv()

# Configure Gemini API
# We try both variable names to be safe
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY') or os.getenv('VITE_GEMINI_API_KEY')

if GOOGLE_API_KEY:
    # Handle potential quotes in the key if they were read from .env
    clean_key = GOOGLE_API_KEY.strip().replace('"', '').replace("'", "")
    genai.configure(api_key=clean_key)
else:
    print("⚠️ Warning: GOOGLE_API_KEY not found in environment")

def chatbot_with_data(patient_id, user_input, diagnoses_data, prescriptions_data, lab_reports_data=None):
    """
    Medical Assistant powered by Gemini AI
    """

    # Format diagnoses
    diagnoses_text = "No diagnosis records found."
    if diagnoses_data:
        diagnoses_text = "\n".join([
            f"- Date: {d.get('date', 'N/A')}, Condition: {d.get('condition', 'N/A')}, "
            f"Severity: {d.get('severity', 'N/A')}, Notes: {d.get('clinical_notes', 'N/A')}"
            for d in diagnoses_data
        ])

    # Format prescriptions
    prescriptions_text = "No prescription records found."
    if prescriptions_data:
        prescriptions_text = "\n".join([
            f"- Medication: {p.get('medication', 'N/A')}, Dosage: {p.get('dosage', 'N/A')}, "
            f"Instructions: {p.get('instructions', 'N/A')}"
            for p in prescriptions_data
        ])

    # Format lab reports
    lab_reports_text = "No lab report records found."
    if lab_reports_data:
        lab_reports_text = "\n".join([
            f"- Test: {lr.get('test_name', 'N/A')}, Date: {lr.get('date', 'N/A')}, "
            f"Result: {lr.get('result', 'N/A')}"
            for lr in lab_reports_data
        ])

    prompt = f"""You are a helpful Medical Data Assistant.

    **Patient ID:** {patient_id}
    **User Question:** {user_input}

    **DIAGNOSES:**
    {diagnoses_text}

    **PRESCRIPTIONS:**
    {prescriptions_text}

    **LAB REPORTS:**
    {lab_reports_text}

    Please provide a helpful, accurate response based on this data:"""

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error communicating with Gemini AI: {str(e)}"
