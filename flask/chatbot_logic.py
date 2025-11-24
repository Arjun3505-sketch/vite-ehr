import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables if not already loaded
load_dotenv()

# Configure Gemini API
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY') or os.getenv('VITE_GEMINI_API_KEY')

if GOOGLE_API_KEY:
    clean_key = GOOGLE_API_KEY.strip().replace('"', '').replace("'", "")
    genai.configure(api_key=clean_key)
else:
    print("⚠️ Warning: GOOGLE_API_KEY not found in environment")

def chatbot_with_data(patient_id, user_input, diagnoses_data, prescriptions_data, lab_reports_data=None, surgeries_data=None, vaccinations_data=None):
    """
    Medical Assistant powered by Gemini AI with comprehensive patient data
    """
    
    print(f"\n{'='*80}")
    print(f"🤖 CHATBOT_LOGIC.PY - Processing request")
    print(f"Patient ID: {patient_id}")
    print(f"Question: {user_input}")
    print(f"{'='*80}\n")
    
    print(f"📊 Data received:")
    print(f"   - Diagnoses: {len(diagnoses_data) if diagnoses_data else 0}")
    print(f"   - Prescriptions: {len(prescriptions_data) if prescriptions_data else 0}")
    print(f"   - Lab Reports: {len(lab_reports_data) if lab_reports_data else 0}")
    print(f"   - Surgeries: {len(surgeries_data) if surgeries_data else 0}")
    print(f"   - Vaccinations: {len(vaccinations_data) if vaccinations_data else 0}")

    # Format diagnoses
    diagnoses_text = "No diagnosis records found."
    if diagnoses_data and len(diagnoses_data) > 0:
        print(f"\n📋 Processing {len(diagnoses_data)} diagnoses...")
        diagnoses_list = []
        for i, d in enumerate(diagnoses_data):
            print(f"   Diagnosis {i+1}: {d}")
            diagnosis_entry = f"- Date: {d.get('date', 'N/A')}\n"
            diagnosis_entry += f"  Diagnosis: {d.get('diagnosis', d.get('condition', 'N/A'))}\n"
            diagnosis_entry += f"  Details: {d.get('details', d.get('clinical_notes', 'N/A'))}\n"
            diagnosis_entry += f"  Severity: {d.get('severity', 'N/A')}\n"
            diagnosis_entry += f"  Doctor: {d.get('doctor_name', 'N/A')}"
            diagnoses_list.append(diagnosis_entry)
        diagnoses_text = "\n\n".join(diagnoses_list)
        print(f"✅ Formatted diagnoses text")

    # Format prescriptions
    prescriptions_text = "No prescription records found."
    if prescriptions_data and len(prescriptions_data) > 0:
        print(f"\n💊 Processing {len(prescriptions_data)} prescriptions...")
        prescriptions_list = []
        for i, p in enumerate(prescriptions_data):
            print(f"   Prescription {i+1}: {p}")
            prescription_entry = f"- Start Date: {p.get('start_date', 'N/A')}\n"
            prescription_entry += f"  Expiry Date: {p.get('expiry_date', 'N/A')}\n"
            
            # Handle medications array
            medications = p.get('medications', [])
            if medications:
                meds_text = "\n  Medications:\n"
                for med in medications:
                    meds_text += f"    • {med.get('medication_name', 'N/A')} - {med.get('dosage', 'N/A')}\n"
                    meds_text += f"      Frequency: {med.get('frequency', 'N/A')}\n"
                    meds_text += f"      Duration: {med.get('duration', 'N/A')}\n"
                    meds_text += f"      Instructions: {med.get('instructions', 'N/A')}\n"
                prescription_entry += meds_text
            
            prescription_entry += f"  Remarks: {p.get('remarks', 'N/A')}\n"
            prescription_entry += f"  Doctor: {p.get('doctor_name', 'N/A')}"
            prescriptions_list.append(prescription_entry)
        prescriptions_text = "\n\n".join(prescriptions_list)
        print(f"✅ Formatted prescriptions text")

    # Format lab reports - WITH DETAILED LOGGING
    lab_reports_text = "No lab report records found."
    if lab_reports_data and len(lab_reports_data) > 0:
        print(f"\n🔬 Processing {len(lab_reports_data)} lab reports...")
        lab_reports_list = []
        for i, lab in enumerate(lab_reports_data):
            print(f"\n   Lab Report {i+1} RAW DATA:")
            print(f"   {lab}")
            
            # Try multiple possible field names
            date = lab.get('date') or lab.get('test_date') or 'N/A'
            test_type = lab.get('test_type') or lab.get('testType') or lab.get('test_name') or lab.get('testName') or 'N/A'
            remarks = lab.get('remarks') or lab.get('results') or lab.get('result') or lab.get('notes') or 'N/A'
            doctor_name = lab.get('doctor_name') or lab.get('doctorName') or 'N/A'
            
            print(f"   Extracted values:")
            print(f"      Date: {date}")
            print(f"      Test Type: {test_type}")
            print(f"      Remarks: {remarks}")
            print(f"      Doctor: {doctor_name}")
            
            lab_entry = f"- Date: {date}\n"
            lab_entry += f"  Test Type: {test_type}\n"
            lab_entry += f"  Results/Remarks: {remarks}\n"
            lab_entry += f"  Doctor: {doctor_name}"
            
            lab_reports_list.append(lab_entry)
            print(f"   Formatted entry:\n{lab_entry}")
        
        lab_reports_text = "\n\n".join(lab_reports_list)
        print(f"\n✅ Formatted {len(lab_reports_data)} lab reports")
        print(f"Final lab reports text:\n{lab_reports_text}")
    else:
        print("⚠️ No lab reports data available")

    # Format surgeries
    surgeries_text = "No surgery records found."
    if surgeries_data and len(surgeries_data) > 0:
        print(f"\n🏥 Processing {len(surgeries_data)} surgeries...")
        surgeries_list = []
        for i, s in enumerate(surgeries_data):
            print(f"   Surgery {i+1}: {s}")
            surgery_entry = f"- Date: {s.get('date', 'N/A')}\n"
            surgery_entry += f"  Procedure: {s.get('procedure', 'N/A')}\n"
            surgery_entry += f"  Outcome: {s.get('outcome', 'N/A')}\n"
            surgery_entry += f"  Complications: {s.get('complications', 'None')}\n"
            surgery_entry += f"  ICD-PCS Code: {s.get('icd_pcs_code', 'N/A')}\n"
            surgery_entry += f"  Remarks: {s.get('remarks', 'N/A')}\n"
            surgery_entry += f"  Doctor: {s.get('doctor_name', 'N/A')}"
            surgeries_list.append(surgery_entry)
        surgeries_text = "\n\n".join(surgeries_list)
        print(f"✅ Formatted surgeries text")

    # Format vaccinations
    vaccinations_text = "No vaccination records found."
    if vaccinations_data and len(vaccinations_data) > 0:
        print(f"\n💉 Processing {len(vaccinations_data)} vaccinations...")
        vaccinations_list = []
        for i, v in enumerate(vaccinations_data):
            print(f"   Vaccination {i+1}: {v}")
            vaccine_entry = f"- Vaccine: {v.get('vaccine_name', 'N/A')}\n"
            vaccine_entry += f"  Date Administered: {v.get('date_administered', 'N/A')}\n"
            vaccine_entry += f"  Administered By: {v.get('administered_by', 'N/A')}\n"
            vaccine_entry += f"  Next Due Date: {v.get('next_due_date', 'Not scheduled')}\n"
            vaccine_entry += f"  Batch Number: {v.get('batch_number', 'N/A')}\n"
            vaccine_entry += f"  Notes: {v.get('notes', 'N/A')}"
            vaccinations_list.append(vaccine_entry)
        vaccinations_text = "\n\n".join(vaccinations_list)
        print(f"✅ Formatted vaccinations text")

    # Create comprehensive context for Gemini
    context = f"""You are a helpful medical assistant chatbot for Patient ID: {patient_id}.

You have access to the following medical records:

=== DIAGNOSES ===
{diagnoses_text}

=== PRESCRIPTIONS ===
{prescriptions_text}

=== LAB REPORTS ===
{lab_reports_text}

=== SURGERIES ===
{surgeries_text}

=== VACCINATIONS ===
{vaccinations_text}

Guidelines:
1. Answer questions accurately based on the patient's medical records above
2. If asked about lab reports, tests, or results, refer to the LAB REPORTS section
3. If asked about medications, prescriptions, or drugs, refer to the PRESCRIPTIONS section
4. If asked about diagnoses, conditions, or diseases, refer to the DIAGNOSES section
5. If asked about surgeries, operations, or procedures, refer to the SURGERIES section
6. If asked about vaccinations, vaccines, or immunizations, refer to the VACCINATIONS section
7. Provide specific dates, values, and details from the records
8. If a record shows "N/A" for a field, that information is not available
9. If information is not in the records, clearly state that
10. For medical advice, always recommend consulting with their doctor
11. Be empathetic, professional, and concise in your responses

Patient's Question: {user_input}

Please provide a helpful, accurate response based on the medical records above."""

    print(f"\n📤 Sending to Gemini AI...")
    print(f"Context length: {len(context)} characters")

    try:
        # Use Gemini 1.5 Flash for faster responses
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(context)
        
        answer = response.text
        print(f"\n✅ Received response from Gemini")
        print(f"Response length: {len(answer)} characters")
        print(f"Response preview: {answer[:200]}...")
        
        return answer
        
    except Exception as e:
        error_msg = f"Error communicating with AI: {str(e)}"
        print(f"\n❌ Gemini API error: {error_msg}")
        import traceback
        traceback.print_exc()
        return f"I apologize, but I'm having trouble processing your request right now. Error: {str(e)}"