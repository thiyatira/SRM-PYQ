import os

# Mapping of original file paths to new file names
file_map = {
  "Paper (1).pdf": "2024-01_ET_QP.pdf",
  "Paper (2).pdf": "2022-12_ET_QP.pdf",
  "Paper (3).pdf": "2023-05_ET_QP.pdf",
  "Paper (4).pdf": "2024-12_ET_QP.pdf",
  "Paper (5).pdf": "2024-07_ET_QP.pdf",
  "Paper (6).pdf": "2023-12_ET_QP.pdf",
  "Paper (7).pdf": "2023-06_ET_QP.pdf",
  "Paper (8).pdf": "2023-06_ET_QP.pdf",
  "Paper (9).pdf": "2024-12_ET_QP.pdf",
  "Paper (10).pdf": "2024-12-04_CT2_SetB_QP.pdf",
  "Paper (11).pdf": "2024-12-04_CT2_SetA_QP.pdf",
  "Paper (12).pdf": "2024-12_ET_QP.pdf",
  "Paper (13).pdf": "2024-11_ET_QP.pdf",
  "Paper (14).pdf": "2023-12_ET_QP.pdf",
  "Paper (15).pdf": "2023-07_ET_QP.pdf",
  "Paper (16).pdf": "2024-01_ET_QP.pdf",
  "Paper (17).pdf": "2023-01_ET_QP.pdf",
  "Paper (18).pdf": "2024-12_ET_QP.pdf",
  "Paper (19).pdf": "2023-01_ET_QP.pdf",
  "Paper (20).pdf": "2022-10-21_CT1_SetR_QP.pdf",
  "Paper (21).pdf": "2024-10-18_CT1_SetB_QP.pdf",
  "Paper (22).pdf": "2024-10-18_CT1_SetB_QP.pdf",
  "Paper (23).pdf": "2024-10-04_CT1_SetB_QP.pdf",
  "Paper (24).pdf": "2024-01_ET_QP.pdf",
  "Paper (25).pdf": "2024-10-01_CT1_SetB_QP.pdf",
  "Paper (26).pdf": "2024-05_ET_QP.pdf",
  "Paper (27).pdf": "2023-11-29_CT3_SetA_QP.pdf",
  "Paper (28).pdf": "2023-07_ET_QP.pdf",
  "Paper (29).pdf": "2024-25_CT1_QP.pdf"
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
