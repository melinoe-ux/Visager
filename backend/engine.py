import os
import shutil
import pickle
import numpy as np
from deepface import DeepFace

# DeepFace Engine
# - Model: ArcFace (512-d embeddings)
# - Detector: retinaface (most accurate) or opencv (faster)
# We'll use ArcFace for recognition.

DB_PATH = os.path.expanduser("~/Documents/aprt/OrganizedPhotos/db.pkl")
PHOTOS_ROOT = os.path.expanduser("~/Documents/aprt/OrganizedPhotos")

# We'll use ArcFace for recognition.
_MODEL_READY = False

def warm_up():
    """Explicitly build the model and warm up the detector."""
    global _MODEL_READY
    print("Initializing DeepFace with ArcFace + RetinaFace...")
    try:
        # Build the model
        DeepFace.build_model("ArcFace")
        # Forcing a small represent to warm up the detector (RetinaFace)
        _ = DeepFace.represent(img_path=np.zeros((224, 224, 3), dtype=np.uint8), 
                               model_name="ArcFace", 
                               detector_backend="retinaface", 
                               enforce_detection=False)
        _MODEL_READY = True
        print("DeepFace (ArcFace/RetinaFace) warmed up and ready.")
    except Exception as e:
        print(f"Error initializing DeepFace: {e}")

def load_db():
    default_db = {"names": [], "encodings": [], "model": "ArcFace"}
    if os.path.exists(DB_PATH):
        try:
            with open(DB_PATH, "rb") as f:
                data = pickle.load(f)
                if "names" not in data: data["names"] = []
                if "encodings" not in data: data["encodings"] = []
                if data.get("model") != "ArcFace":
                    return default_db
                return data
        except Exception:
            return default_db
    return default_db

def save_db(db):
    try:
        db["model"] = "ArcFace"
        with open(DB_PATH, "wb") as f:
            pickle.dump(db, f)
    except Exception as e:
        print(f"Error saving DB: {e}")

def get_face_embedding(image_path):
    """Convenience wrapper for single face embedding."""
    faces = get_faces(image_path)
    if faces:
        return np.array(faces[0]["embedding"])
    return None

def register_new_person(name, image_path_for_encoding):
    """
    Called by API when user names a person.
    We need to compute the embedding from the image now in the sorted folder.
    """
    vec = get_face_embedding(image_path_for_encoding)
    if vec is not None:
        db = load_db()
        
        # Check if person exists
        if name in db["names"]:
            idx = db["names"].index(name)
            db["encodings"][idx].append(vec.tolist())
        else:
            db["names"].append(name)
            db["encodings"].append([vec.tolist()])
            
        save_db(db)
        print(f"Registered {name} with new ArcFace embedding.")
    else:
        print(f"Warning: Could not extract face for {name} from {image_path_for_encoding}")

def get_faces(image_path):
    """
    Detects ALL faces and returns their embeddings.
    """
    try:
        results = DeepFace.represent(
            img_path=image_path,
            model_name="ArcFace",
            detector_backend="retinaface", # Highly accurate for angles/makeup/lighting
            enforce_detection=True,
            align=True
        )
        return results
    except Exception as e:
        if "Face could not be detected" in str(e):
             return []
        print(f"Error in DeepFace multi-detection: {e}")
        return []

def process_image(image_path):
    print(f"Engine: Analyzing {os.path.basename(image_path)}...")
    if not os.path.exists(image_path):
        return "Error"
    
    faces = get_faces(image_path)
    
    if not faces:
        print(f"AI: No faces found in {os.path.basename(image_path)}. Moving to Unsorted.")
        target = "Unsorted"
    elif len(faces) > 1:
        print(f"AI: {len(faces)} faces detected. Moving to Group_Photos.")
        target = "Group_Photos"
    else:
        # Single Face Logic
        vec = np.array(faces[0]["embedding"])
        db = load_db()
        best_name = None
        min_dist = 0.6 # Optimized for ArcFace (Cosine Dist)
        
        for name, known_vecs in zip(db["names"], db["encodings"]):
            known_vecs_arr = np.array(known_vecs)
            dot_product = np.dot(known_vecs_arr, vec)
            norms = np.linalg.norm(known_vecs_arr, axis=1) * np.linalg.norm(vec)
            dists = 1 - (dot_product / norms)
            
            dist = dists.min()
            if dist < min_dist:
                min_dist = dist
                best_name = name
        
        if best_name:
            print(f"AI MATCH: Detected '{best_name}' (Dist: {min_dist:.4f})")
            target = best_name
        else:
            print(f"AI: New Face Detected! Moving to Needs_Name.")
            target = "Needs_Name"

    # Move File
    target_folder = os.path.join(PHOTOS_ROOT, target)
    os.makedirs(target_folder, exist_ok=True)
    
    filename = os.path.basename(image_path)
    final_path = os.path.join(target_folder, filename)
    
    if os.path.exists(final_path):
        base, ext = os.path.splitext(filename)
        final_path = os.path.join(target_folder, f"{base}_{np.random.randint(1000)}{ext}")

    shutil.move(image_path, final_path)
    return target
