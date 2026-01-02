import sys
import os
import cv2
import numpy as np

# Add project root to path
sys.path.append(os.getcwd())

from backend import engine

# Compare two specific files
known_file = os.path.expanduser("~/Documents/aprt/OrganizedPhotos/Minatozaki Sana/TWICE-13th-Mini-Album-With-YOU-th-Concept-Photo-documents-8(2).jpeg")
unknown_file = os.path.expanduser("~/Documents/aprt/OrganizedPhotos/Needs_Review/SANA-x-NE-AR-V-Care-Plus-documents-2.jpeg")

print(f"Comparing:")
print(f"Known: {known_file}")
print(f"Unknown: {unknown_file}")

try:
    vec1 = engine.get_face_embedding(known_file)
    vec2 = engine.get_face_embedding(unknown_file)
    
    if vec1 is None:
        print("Error: No face found in known file.")
    elif vec2 is None:
        print("Error: No face found in unknown file.")
    else:
        dist = np.linalg.norm(vec1 - vec2)
        print(f"DISTANCE: {dist:.4f}")
        
except Exception as e:
    print(f"CRITICAL ERROR: {e}")
    import traceback
    traceback.print_exc()
