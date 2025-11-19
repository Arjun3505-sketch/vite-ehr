import os
import google.generativeai as genai

# Configure Gemini API
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY', 'AIzaSyCqNjWgxoGVaiLQDDq9j3FapzUPiHoh-wc')
genai.configure(api_key=GOOGLE_API_KEY)

def chatbot_with_data(patient_id, user_input, diagnoses_data, prescriptions_data, lab_reports_data=None):
    """
    Medical Assistant powered by Gemini AI
    
    Args:
        patient_id: The patient's ID
        user_input: The user's question
        diagnoses_data: List of diagnosis records
        prescriptions_data: List of prescription records
        lab_reports_data: Optional list of lab report records
    
    Returns:
        AI-generated response as a string
    """
    
    # Format diagnoses data for the prompt
    diagnoses_text = ""
    if diagnoses_data and len(diagnoses_data) > 0:
        diagnoses_text = "\n".join([
            f"- Date: {d.get('date', 'N/A')}, Condition: {d.get('condition', 'N/A')}, "
            f"Severity: {d.get('severity', 'N/A')}, Notes: {d.get('clinical_notes', 'N/A')}"
            for d in diagnoses_data
        ])
    else:
        diagnoses_text = "No diagnosis records found."
    
    # Format prescriptions data for the prompt
    prescriptions_text = ""
    if prescriptions_data and len(prescriptions_data) > 0:
        prescriptions_text = "\n".join([
            f"- Medication: {p.get('medication', 'N/A')}, Dosage: {p.get('dosage', 'N/A')}, "
            f"Frequency: {p.get('frequency', 'N/A')}, Duration: {p.get('duration', 'N/A')}, "
            f"Instructions: {p.get('instructions', 'N/A')}"
            for p in prescriptions_data
        ])
    else:
        prescriptions_text = "No prescription records found."
    
    # Format lab reports data if provided
    lab_reports_text = ""
    if lab_reports_data and len(lab_reports_data) > 0:
        lab_reports_text = "\n".join([
            f"- Test: {lr.get('test_name', 'N/A')}, Date: {lr.get('date', 'N/A')}, "
            f"Result: {lr.get('result', 'N/A')}, Status: {lr.get('status', 'N/A')}"
            for lr in lab_reports_data
        ])
    else:
        lab_reports_text = "No lab report records found."
    
    # Construct the prompt for Gemini
    prompt = f"""You are a helpful Medical Data Assistant. Your role is to help doctors and healthcare professionals understand patient medical records.

**IMPORTANT INSTRUCTIONS:**
1. Answer questions based *only* on the provided patient data below
2. Be concise, clear, and professional
3. If the data doesn't contain the answer, politely say so
4. Provide medical insights when relevant
5. Use proper medical terminology
6. Summarize information when asked
7. Highlight important findings or patterns

**Patient ID:** {patient_id}

**User Question:** {user_input}

**📋 DIAGNOSES:**
{diagnoses_text}

**💊 PRESCRIPTIONS:**
{prescriptions_text}

**🔬 LAB REPORTS:**
{lab_reports_text}

Please provide a helpful, accurate response based on this data:"""

    try:
        # Use Gemini 1.5 Flash model for fast responses
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.3,  # Lower temperature for more factual responses
                top_p=0.8,
                top_k=40,
                max_output_tokens=1024,
            )
        )
        
        return response.text
        
    except Exception as e:
        error_message = f"Error communicating with Gemini AI: {str(e)}"
        print(error_message)
        return error_message
