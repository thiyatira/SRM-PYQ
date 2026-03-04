import os

# Mapping of original file paths to new file names
file_map={
    "Paper (1).pdf": "2025-01_ET_QP(1).pdf",
    "Paper (2).pdf": "2019-11_ET_QP(1).pdf",
    "Paper (3).pdf": "2023-05_ET_QP.pdf",
    "Paper (4).pdf": "2023-01_ET_QP.pdf",
    "Paper (5).pdf": "2024-09-25_CT1_Set1_QP.pdf",
    "Paper (6).pdf": "2019-08-09_CT1_Key.pdf",
    "Paper (7).pdf": "2022-12-13_CT3_Set2_QP.pdf",
    "Paper (8).pdf": "2020-11_ET_QP.pdf",
    "Paper (9).pdf": "2025-02-19_CT1_Set1_QP.pdf",
    "Paper (10).pdf": "2022-07_ET_QP.pdf",
    "Paper (11).pdf": "2024-01_ET_QP.pdf",
    "Paper (12).pdf": "2023-10-13_CT2_Set2_QP.pdf",
    "Paper (13).pdf": "2021-05_ET_QP.pdf",
    "Paper (14).pdf": "2023-02-16_CT1_Set1_QP-Key.pdf",
    "Paper (15).pdf": "2016-03-24_CT2_QP.pdf",
    "Paper (16).pdf": "2022-11-12_CT2_Set1_QP.pdf",
    "Paper (17).pdf": "2021-22_CT1_Sample-QP.pdf",
    "Paper (18).pdf": "2019-11_ET_QP(2).pdf",
    "Paper (19).pdf": "2018-19_CT2_Sample-QP.pdf",
    "Paper (20).pdf": "2023-09-13_CT1_Set1_QP.pdf",
    "Paper (21).pdf": "2023-09-11_CT1_Set1_QP.pdf",
    "Paper (22).pdf": "2021-11_ET_QP.pdf",
    "Paper (23).pdf": "2024-11-21_CT2_Set1_QP.pdf",
    "Paper (24).pdf": "2023-12_ET_QP.pdf",
    "Paper (25).pdf": "2023-09-13_CT1_Set1_QP.pdf",
    "Paper (26).pdf": "2022-05_ET_QP.pdf",
    "Paper (27).pdf": "2022-11-19_CT2_Set1_QP-Key.pdf",
    "Paper (28).pdf": "2022-11-19_CT2_Set2_QP-Key.pdf",
    "Paper (29).pdf": "2022-06-20_CT3_Set1_QP-Key.pdf",
    "Paper (30).pdf": "2023-10-13_CT2_Set2_QP-Key.pdf",
    "Paper (31).pdf": "2025-01_ET_QP(2).pdf"
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
