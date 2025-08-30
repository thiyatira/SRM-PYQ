import os

# Mapping of original file paths to new file names
file_map = {
  "paper (1).pdf": "2023-10-13_CT1_QP.pdf",
  "paper (2).pdf": "2024-09-24_CT1_SetA_QP.pdf",
  "paper (3).pdf": "2022-10-20_CT1_QP.pdf",
  "paper (4).pdf": "2022-11-23_CT2_QP.pdf",
  "paper (5).pdf": "2022-12-23_CT3_QP.pdf",
  "paper (6).pdf": "2023-01_ET_QP.pdf",
  "paper (7).pdf": "2023-02-28_CT1_SetC_B2_QP-Key.pdf",
  "paper (8).pdf": "2023-04-17_CT1_SetD_B2_QP.pdf",
  "paper (9).pdf": "2025-01-31_CT1_SetA_QP-Key.pdf",
  "paper (10).pdf": "2024-09-27_CT1_SetC_QP.pdf",
  "paper (11).pdf": "2023-11-03_CT2_SetD_B2_QP-Key.pdf",
  "paper (12).pdf": "2023-12_ET_SetA_QP.pdf",
  "paper (13).pdf": "2023-12_ET_SetB_QP.pdf",
  "paper (14).pdf": "2023-09-25_CT1_SetA_QP.pdf",
  "paper (15).pdf": "2024-03-28_CT2_SetA_QP-Key.pdf",
  "paper (16).pdf": "2024-03-28_CT2_SetA_QP.pdf",
  "paper (17).pdf": "2021-11-01_CT1_QP.pdf",
  "paper (18).pdf": "2025-03-10_CT2_SetB_QP-Key.pdf",
  "paper (19).pdf": "2024-11-22_CT2_SetD_B2_QP.pdf",
  "paper (20).pdf": "2023-11-25_CT3_QP-Key.pdf",
  "paper (21).pdf": "2024-12-11_CT3_SetD_B2_QP.pdf",
  "paper (22).pdf": "2024-11-22_CT2_SetC_B2_QP.pdf",
  "paper (23).pdf": "2025-05_ET_QP.pdf",
  "paper (24).pdf": "2022-04-23_CT3_SetB_QP-Key.pdf",
  "paper (25).pdf": "2023-05_ET_QP.pdf",
  "paper (26).pdf": "2024-01_ET_QP.pdf"
}

# Find the common path prefix
all_paths = list(file_map.keys())
common_path = os.path.commonpath(all_paths)

print(f"Common path: {common_path}")

# Rename files by removing the common path and renaming to the new name in the same directory
for old_path, new_name in file_map.items():
    # Remove the common path to get the relative file name
    rel_path = os.path.relpath(old_path, common_path)
    # Get the directory of the old file
    dir_path = os.path.dirname(old_path)
    # New file path (same directory, new name)
    new_path = os.path.join(dir_path, new_name)
    print(f"Renaming:\n  {old_path}\n  -> {new_path}")
    try:
        os.rename(old_path, new_path)
    except FileNotFoundError:
        print(f"File not found: {old_path}")
    except Exception as e:
        print(f"Error renaming {old_path} to {new_path}: {e}")
