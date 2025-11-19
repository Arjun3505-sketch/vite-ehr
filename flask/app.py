import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from chatbot_logic import chatbot_with_data
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Initialize Supabase client
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://vdiqihlidfnjbednpbtx.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkaXFpaGxpZGZuamJlZG5wYnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM3MzcsImV4cCI6MjA3MjMxOTczN30.TD_BbrPPw4K0HcdhLMvBz21Fj0NtJ4KBg3o7kGQeeKw')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Medical AI Chatbot Server is running'
    }), 200

@app.route('/fetch', methods=['POST'])
def fetch_patient_data():
    """
    Fetch patient medical data from Supabase
    Expects JSON: { "patient_id": "some-uuid" }
    Returns: { "diagnoses": [...], "prescriptions": [...], "lab_reports": [...] }
    """
    try:
        data = request.get_json()
        patient_id = data.get('patient_id')
        
        if not patient_id:
            return jsonify({'error': 'patient_id is required'}), 400
        
        # Fetch diagnoses
        diagnoses_response = supabase.table('diagnoses')\
            .select('*')\
            .eq('patient_id', patient_id)\
            .order('date', desc=True)\
            .execute()
        
        # Fetch prescriptions
        prescriptions_response = supabase.table('prescriptions')\
            .select('*')\
            .eq('patient_id', patient_id)\
            .order('created_at', desc=True)\
            .execute()
        
        # Fetch lab reports (if table exists)
        lab_reports = []
        try:
            lab_reports_response = supabase.table('lab_reports')\
                .select('*')\
                .eq('patient_id', patient_id)\
                .order('date', desc=True)\
                .execute()
            lab_reports = lab_reports_response.data
        except Exception as e:
            print(f"Lab reports table might not exist: {e}")
            lab_reports = []
        
        return jsonify({
            'success': True,
            'diagnoses': diagnoses_response.data,
            'prescriptions': prescriptions_response.data,
            'lab_reports': lab_reports
        }), 200
        
    except Exception as e:
        print(f"Error fetching patient data: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/chat_with_data', methods=['POST'])
def chat_with_patient_data():
    """
    Process user question with patient data using Gemini AI
    Expects JSON: {
        "patient_id": "some-uuid",
        "message": "user question",
        "diagnoses": [...],
        "prescriptions": [...],
        "lab_reports": [...] (optional)
    }
    Returns: { "response": "AI generated answer" }
    """
    try:
        data = request.get_json()
        
        patient_id = data.get('patient_id')
        message = data.get('message')
        diagnoses = data.get('diagnoses', [])
        prescriptions = data.get('prescriptions', [])
        lab_reports = data.get('lab_reports', [])
        
        if not patient_id or not message:
            return jsonify({'error': 'patient_id and message are required'}), 400
        
        # Call the AI chatbot logic
        ai_response = chatbot_with_data(
            patient_id=patient_id,
            user_input=message,
            diagnoses_data=diagnoses,
            prescriptions_data=prescriptions,
            lab_reports_data=lab_reports
        )
        
        return jsonify({
            'success': True,
            'response': ai_response
        }), 200
        
    except Exception as e:
        print(f"Error in chat: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"🏥 Medical AI Chatbot Server starting on port {port}...")
    print(f"📡 CORS enabled for frontend communication")
    print(f"🤖 Gemini AI powered medical assistant ready")
    app.run(debug=True, host='0.0.0.0', port=port)
