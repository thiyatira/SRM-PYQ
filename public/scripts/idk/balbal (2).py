# data = {
#   "QP PPS CT1 SET 1.pdf": "2023-10-05_CT1_Set1_QP.pdf",
#   "Question paper 30-9-2024.pdf": "2024-09-30_CT1_Set1_QP.pdf",
#   "PPS CT1 MCQ Answer Key - PPS notes from 2022-2023.pdf": "2021-22_CT1_MCQ-Key.pdf",
#   "18CSS101J-1 to 2 Sem - PYQ.pdf": "2022-05_ET_QP.pdf",
#   "18CSS101J 1 SEM - End sem paper.pdf": "2019-01_ET_QP.pdf",
#   "18CSS101J-PPS CT1 Questions.pdf": "2021-05-18_CT1_SetB_QP.pdf",
#   "QP PPS CT1 SET 2.pdf": "2023-10-05_CT1_Set2_QP.pdf",
#   "Answer KEY - PPS CT1 SET 5 AND 6 OCT 2023.pdf": "2023-10_CT1_Set5-6_Key.pdf",
#   "Answer Key Question paper format - B.Tech I Year (IE 2).pdf": "2023-11-28_CT2_QP-Key.pdf",
#   "CT-1 Q.P& Key batch 8 am exam.pdf": "2023-09-11_CT1_Set1_QP-Key.pdf",
#   "Ct1 Question Pater 1st.pdf": "2022-10-12_CT1_SetD_QP.pdf",
#   "Pps sqp - Sample paper.pdf": "2023-07_ET_Sample-QP.pdf",
#   "Ct2- key - Ct2- key.pdf": "2021-01-12_CT2_Key.pdf",
#   "CT2 Set A.pdf": "2023-05-09_CT2_SetA_QP.pdf",
#   "Ct2 - Ct2.pdf": "2021-01-12_CT2_QP.pdf",
#   "CT2 SET1.pdf": "2022-23_CT2_QP.pdf",
#   "CTII Set 3 answer key.pdf": "2023-11-03_CT2_Set3_Key.pdf",
#   "CT 1 Question Pater 1st.pdf": "2022-10-12_CT1_SetC_QP.pdf",
#   "D - Previous year question paper.pdf": "2022-23_CT1_SetD_QP-Key.pdf",
#   "FJ II 21CSS101J set C - pps ct 2 paper.pdf": "2024-04-01_CT2_SetC_QP.pdf",
#   "Pps ct 1 set 3 - Pyqs for CT.pdf": "2022-23_CT1_Set3_QP-Key.pdf",
#   "Pps ct 1 set 2 - Pyqs for CT.pdf": "2022-23_CT1_QP.pdf",
#   "Pps ct 1 set 4 - Pyqs for CT.pdf": "2022-23_CT1_Set4_QP.pdf",
#   "PPS CT Paper (Batch 1, Set A).pdf": "2024-04-01_CT2_SetA_B1_QP.pdf",
#   "PPS CT Paper (Set B).pdf": "2025-02-24_CT1_SetB_QP.pdf",
#   "PPS CT2 - Prev year QP Set-7.pdf": "2022-23_CT2_Set7_QP-Key.pdf",
#   "PPS CT2 - Prev year QP Set-3.pdf": "2022-23_CT2_Set3_QP-Key.pdf",
#   "PPS sem qp - question paper.pdf": "2022-12_ET_QP.pdf",
#   "Question bank for ct 3.pdf": "CT3_QBank.pdf",
#   "Sample For PPS CT2.pdf": "2022-23_CT2_Sample-QP.pdf",
#   "Set B -answer key CT-3 - PPS CLAT - 3 SET-B QUESTION PAPER.pdf": "2021-22_CT3_SetB_QP-Key.pdf",
#   "Set C- Answer Key CT-3 - PPS CLAT - 3 SET-C QUESTION PAPER.pdf": "2021-22_CT3_SetC_QP-Key.pdf",
#   "CT question paper 2024 PPS.pdf": "2024-12-10_CT2_Set3_QP.pdf",
#   "Set A -Answer Key CT-3 - PPS CLAT - 3 SET-A QUESTION PAPER.pdf": "2021-22_CT3_SetA_QP-Key.pdf"
# }
data = {
  "CT1 SET 2 - 21CSS101J Programming for Problem Solving (AY 2023-24).pdf": "AY2023-24_CT1_Set2_QP.pdf",
  "CT3_QBank.pdf": "CT3_QBank.pdf",
  "CYCLE TEST -I  Academic Year 2022-2023 (ODD Semester).pdf": "AY2022-23_CT1_QP.pdf",
  "pps  EXAMINATION, JULY 2023.pdf": "2023-07_ET_Sample-QP.pdf",
  "PPS 18CSS101J CT1 MCQ Answer Key & Solutions - 2021-2022.pdf": "AY2021-22_CT1_MCQ-Key.pdf",
  "PPS CT Paper 1.pdf": "2024-04-01_CT2_SetA_B1_QP.pdf",
  "PPS CT Paper.pdf": "2025-02-24_CT1_SetB_QP.pdf",
  "QP 21CSS101J Programming for Problem Solving - Cycle Test I.pdf": "2023-10-05_CT1_Set1_QP.pdf",
  "C Programming Questions Paper - 30th September 2024.pdf": "2024-09-30_CT1_Set1_QP.pdf"
}
import os

for old, new in data.items():
    if os.path.isfile(old):
        try:
            os.rename(old, new)
            print(f"Renamed '{old}' -> '{new}'")
        except Exception as e:
            print(f"Error renaming '{old}' to '{new}': {e}")
    else:
        print(f"File not found: '{old}'")

