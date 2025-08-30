import os
import json
import re
from pathlib import Path
import google.generativeai as genai

# --- Configuration ---

# 1. Set up your API key. 
# It's highly recommended to use an environment variable for security.
# The script will try to read it from the environment variable 'GEMINI_API_KEY'.
# If you must hardcode it, replace os.environ.get("GEMINI_API_KEY") with "YOUR_API_KEY"
API_KEY = "AIzaSyBxoaPUFCnCcmWDNeR06YyBgiCOY_2j4FU"
if not API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set. Please set it to your API key.")

genai.configure(api_key=API_KEY)

# 2. Define the model to use. 
# Gemini 1.5 Pro is excellent for analyzing entire documents.
MODEL_NAME = "models/gemini-2.5-flash" 

# 3. Define the output folder
OUTPUT_DIR = "json_outputs"

# 4. List of PDF files to process (as provided in the request)
PDF_FILES = [
"2021-11-01_CT1_QP.pdf",
"2022-10-20_CT1_QP.pdf",
"2022-11-23_CT2_QP.pdf",
"2022-12-23_CT3_QP.pdf",
"2023-01_ET_QP.pdf",
"2023-02-20_CT1_SetC_B2_QP-Key.pdf",
"2023-04-17_CT1_SetD_B2_QP.pdf",
"2023-05_ET_QP.pdf",
"2023-09-25_CT1_SetA_QP.pdf",
"2023-10-13_CT1_QP.pdf",
"2023-11-03_CT2_SetD_B2_QP-Key.pdf",
"2023-11-25_CT3_QP-Key.pdf",
"2023-12_ET_SetA_QP.pdf",
"2023-12_ET_SetB_QP.pdf",
"2024-01_ET_QP.pdf",
"2024-03-28_CT2_SetA_QP-Key.pdf",
"2024-03-28_CT2_SetA_QP.pdf",
"2024-09-24_CT1_SetA_QP.pdf",
"2024-09-27_CT1_SetC_QP.pdf",
"2024-11-22_CT2_SetC_B2_QP.pdf",
"2024-11-22_CT2_SetD_B2_QP.pdf",
"2024-12-11_CT3_SetD_B2_QP.pdf",
"2025-01-31_CT1_SetA_QP-Key.pdf",
"2025-03-10_CT2_SetB_QP-Key.pdf",
"2025-04-23_CT3_SetB_QP-Key.pdf",
"2025-05_ET_QP.pdf"
]

# 5. The syllabus for context
SYLLABUS = """
Programming for Problem Solving (Engineering Science Course)
Course: Programming for Problem Solving
Code: 21CSS101J
Course Philosophy of Engineering
Code 21GNH101J
Course Content
Unit Title & Content Hours
Unit 1: IntroducƟon to Philosophy of Engineering- Define Engineering - History of Engineering
Development - PracƟce 1: Compare Prehistory, Medieval and Present Engineering Development -
RelaƟon between Arts, MathemaƟcs, Science, Technology and Engineering - STEAM Pyramid -
PracƟce 2: STEAM Pyramid Analysis: Is Art Context Necessary? - Desired AƩributes of an Engineer -
Engineering Habits of Mind - PracƟce 3: Case Study on AƩributes of an Engineer.
9
Unit 2: Ontology of Engineering- Ontology - Reference Ontology and ApplicaƟon Ontology - PracƟce 4:
Reference Ontology using Concept/Mind Mapping - Suites of Ontology Modules - FuncƟons and
CapabiliƟes - PracƟce 5: Engineering ApplicaƟon Ontology using Concept/Mind Mapping - Product
Life Cycle - CommodiƟes, Services and Infrastructure - PracƟce 6: Product Life Cycle Ontology using
Concept/Mind Mapping.
 9
Unit 3: Epistemology of Engineering- RelaƟons between Science, Technology and Engineering - QuesƟons
on Philosophy of Engineering - PracƟce 7: Analyze the nature, contents and complexity of the
knowledge base in engineering Four Dimensions of Engineering - RIASEC Model - PracƟce 8: Case
Study on RIASEC Theory of Career Choice - Epistemology of Engineering Design - Rigour, CreaƟvity
and Change in Engineering - PracƟce 9: Analyze DisƟncƟve Features of Epistemology of Engineering
Design.
9
Unit 4: Methodology of Engineering -Difference between ScienƟfic Method and Engineering Design
(ADDIE)- CDIO Engineers in Industry - PracƟce 10: Relate ADDIE and CDIO Methodology - Conceive
and Design - Engineering Design Process PracƟce 11: Illustrate the Engineering Design Process for
the given ApplicaƟon - Implement and Operate - OperaƟonal Factors in System Design - PracƟce 12:
Analyze the Requirements of OperaƟonal Engineers.
9
Unit 5: Axiology of Engineering- Engineering and Society- Engineers Code of Ethics - PracƟce 13: Evaluate
Popular InvenƟons and apply their new point of view to Re-Design - Sustainability and Diversity -
Engineer’s role to achieve Sustainable Development - PracƟce 14: Case Study on Achieving
Sustainable Development Goals - Socio-PoliƟcs of Technology & Engineering - Professional
Engineering OrganizaƟons - PracƟce 15: Case Study on Professional Engineering OrganizaƟons.
"""

# 6. The master prompt template for the LLM
PROMPT_TEMPLATE = """
You are an expert academic assistant specializing in computer science education. Your task is to analyze and transcribe a university-level question paper PDF into a structured JSON format.

**Instructions:**
1.  Read the provided PDF file, which is a question paper. The filename may contain "QP" (Question Paper) and "Key" (Answer Key).
2.  Transcribe all questions in the exact order they appear in the paper.
3.  For each question, extract or generate the required information as specified below.
4.  Your entire output MUST be a single, valid JSON object and nothing else. Do not include any introductory text, explanations, or markdown formatting like ```json.

**JSON Structure:**
The root of the JSON object should have the following keys: `paper_title`, `source`, and `questions`.
The `questions` key should be a list of objects, where each object represents a single question and has the following keys:
-   `question_number`: (string) The number of the question as it appears on the paper (e.g., "1a", "2", "3(b)").
-   `question_text`: (string) The full and exact text of the question. Preserve formatting like code snippets or newlines where important.
-   `marks`: (integer or null) The marks allocated to the question. If marks are not mentioned, use `null`.
-   `answer`: (string) The answer to the question.
    -   If the PDF filename contains "Key", it means answers are provided. Transcribe the answer for each question **exactly** as it is given.
    -   If the PDF filename does **not** contain "Key", you must generate a concise, accurate, and well-explained answer suitable for a university student.
-   `answer_source`: (string) Must be one of two values:
    -   "provided": If the answer was transcribed from the PDF (i.e., "Key" was in the filename).
    -   "generated": If you generated the answer because no key was available.
-   `chapter`: (string) Based on the provided syllabus, identify the most relevant unit for this question. Format it as "Unit X:" eg. chapter: "Unit 1:", "Unit 3:".

**Syllabus for Context:**
---
{syllabus}
---

**Source Information:**
The source for this paper is: `{source_name}`. Use this exact string for the `source` field in the root of the JSON.

Now, analyze the provided PDF and generate the JSON output.
"""

def clean_filename_for_source(filename):
    """Cleans the PDF filename to create a human-readable source string."""
    # Use stem to remove the .pdf extension
    base_name = Path(filename).stem
    # Remove common suffixes and replace underscores with spaces
    cleaned_name = re.sub(r'(_QP-Key|_QP|_Key)$', '', base_name, flags=re.IGNORECASE)
    cleaned_name = cleaned_name.replace('_', ' ')
    return cleaned_name

def process_pdf(pdf_path, model):
    """Processes a single PDF file and returns the generated JSON data or raw response if JSON parsing fails."""
    if not pdf_path.exists():
        print(f"   [Error] File not found: {pdf_path}")
        return None, None  # (json_data, raw_response)

    print(f"-> Uploading {pdf_path.name} to Gemini...")
    try:
        # Upload the file to the Gemini API
        pdf_file = genai.upload_file(path=pdf_path, display_name=pdf_path.name)
    except Exception as e:
        print(f"   [Error] Failed to upload file {pdf_path.name}: {e}")
        return None, None

    source_name = clean_filename_for_source(pdf_path.name)
    
    # Fill in the prompt template with the specific details for this file
    prompt = PROMPT_TEMPLATE.format(syllabus=SYLLABUS, source_name=source_name)

    print(f"-> Generating content for {pdf_path.name}...")
    try:
        # Make the API call
        response = model.generate_content([prompt, pdf_file])
        
        # Clean the response to ensure it's a valid JSON string
        # Models sometimes wrap the JSON in ```json ... ```
        cleaned_response = response.text.strip()
        if cleaned_response.startswith("```json"):
            cleaned_response = cleaned_response[7:]
        if cleaned_response.endswith("```"):
            cleaned_response = cleaned_response[:-3]
        
        # Try to parse the JSON string into a Python dictionary
        try:
            return json.loads(cleaned_response), None
        except Exception as e:
            print(f"   [Warning] JSON parsing failed for {pdf_path.name}: {e}")
            return None, cleaned_response

    except Exception as e:
        print(f"   [Error] An error occurred during generation or JSON parsing for {pdf_path.name}: {e}")
        return None, None

def main():
    """Main function to orchestrate the processing of all PDFs."""
    print("Starting Question Paper Processing Script...")
    
    # Create the output directory if it doesn't exist
    output_path = Path(OUTPUT_DIR)
    output_path.mkdir(exist_ok=True)
    print(f"Output will be saved in '{output_path.resolve()}'")

    # Initialize the Generative Model
    model = genai.GenerativeModel(MODEL_NAME)

    # Filter the list to only include question papers ("QP" in the name)
    question_papers = [f for f in PDF_FILES if 'QP' in f]

    for i, filename in enumerate(question_papers):
        print("-" * 50)
        print(f"Processing file {i+1}/{len(question_papers)}: {filename}")
        
        pdf_path = Path(filename)
        output_filename = pdf_path.stem + ".json"
        output_file_path = output_path / output_filename

        # Skip if file already exists in output directory
        if output_file_path.exists():
            print(f"   [Skip] JSON already exists: {output_file_path}")
            continue

        json_data, raw_response = process_pdf(pdf_path, model)

        # Save the JSON data to a file, or the raw response if JSON parsing failed
        try:
            with open(output_file_path, 'w', encoding='utf-8') as f:
                if json_data is not None:
                    json.dump(json_data, f, indent=4)
                    print(f"   [Success] Successfully saved JSON to {output_file_path}")
                elif raw_response is not None:
                    f.write(raw_response)
                    print(f"   [Warning] Saved raw LLM response to {output_file_path} due to JSON parsing error.")
                else:
                    print(f"   [Error] No data to write for {output_file_path}")
        except Exception as e:
            print(f"   [Error] Could not write JSON or raw response file: {e}")
    
    print("-" * 50)
    print("All question papers have been processed.")


if __name__ == "__main__":
    main()