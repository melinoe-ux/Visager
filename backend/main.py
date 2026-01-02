from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
import shutil
import asyncio
import concurrent.futures
from typing import List
from starlette.concurrency import run_in_threadpool

# import engine  <-- MOVED TO LAZY LOADING

app = FastAPI()

# Global Queue for sequential task management
photo_queue = asyncio.Queue()

# Progress State
progress_state = {
    "total_queued": 0,
    "processed_count": 0,
    "current_file": "",
    "status": "idle" # idle, indexing, analyzing
}

async def worker():
    """Manages the queue and hands off tasks to the isolated AI process."""
    import engine # Lazy Load
    engine.PHOTOS_ROOT = UPLOAD_DIR
    print(f"Backend: Manager Worker [PID {os.getpid()}] started.")
    loop = asyncio.get_event_loop()
    while True:
        file_path = await photo_queue.get()
        progress_state["status"] = "analyzing"
        progress_state["current_file"] = os.path.basename(file_path)
        
        print(f"Worker: Handoff to AI Process: {os.path.basename(file_path)}")
        try:
            # Shield the main loop by running in a separate system process
            await loop.run_in_executor(app.state.executor, engine.process_image, file_path)
            print(f"Worker: AI Process finished {os.path.basename(file_path)}")
        except Exception as e:
            print(f"Worker ERROR on {file_path}: {e}")
        finally:
            progress_state["processed_count"] += 1
            if progress_state["processed_count"] >= progress_state["total_queued"]:
                progress_state["status"] = "idle"
                progress_state["current_file"] = ""
            
            photo_queue.task_done()

@app.on_event("startup")
async def startup_event():
    # 1. Initialize Process Pool inside startup to prevent fork-recursion on macOS
    app.state.executor = concurrent.futures.ProcessPoolExecutor(max_workers=1)
    
    # 2. Start the async queue manager
    app.state.worker_task = asyncio.create_task(worker())
    
    print(f"Backend: Visager 1.8 initialized [PID {os.getpid()}]. AI isolation active.")

@app.on_event("shutdown")
async def shutdown_event():
    print("Backend: Shutting down...")
    app.state.executor.shutdown(wait=True)
    print("Backend: Executor shut down.")

# --- Configuration ---
UPLOAD_DIR = os.path.expanduser("~/Documents/aprt/OrganizedPhotos")
os.makedirs(UPLOAD_DIR, exist_ok=True)
# engine.PHOTOS_ROOT = UPLOAD_DIR <-- MOVED TO LAZY INIT
app.mount("/images", StaticFiles(directory=UPLOAD_DIR), name="images")

# --- Endpoints ---

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "queue_size": photo_queue.qsize(),
        "ai_worker_alive": not app.state.worker_task.done()
    }

@app.get("/")
def home():
    return {"app": "Visager", "version": "1.7", "mode": "Direct-Stream"}

@app.get("/photos")
def get_all_photos():
    """Returns a unified list of all processed photos (excluding Inbox)."""
    all_photos = []
    if not os.path.exists(UPLOAD_DIR): return []
    
    # Traverse all folders EXCEPT Inbox and Unsorted (or include Unsorted if you want)
    for root, dirs, files in os.walk(UPLOAD_DIR):
        # Skip Inbox for the general library
        if "Inbox" in root: continue
        
        album_name = os.path.basename(root)
        if album_name == "OrganizedPhotos": album_name = "Library"

        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                # Create a relative path for the /images mount
                rel_path = os.path.relpath(os.path.join(root, file), UPLOAD_DIR)
                all_photos.append({
                    "id": f"{album_name}-{file}",
                    "name": file,
                    "src": f"http://localhost:8000/images/{rel_path}",
                    "album": album_name
                })
    
    # Sort by "name" or date if available (here we just return alphabetical for now)
    return sorted(all_photos, key=lambda x: x['name'], reverse=True)

@app.post("/index")
async def index_photos(paths: List[str]):
    """
    Accepts a list of local file paths and queues them for processing.
    """
    progress_state["status"] = "indexing"
    progress_state["total_queued"] = len(paths)
    progress_state["processed_count"] = 0
    
    # Copy files to OrganizedPhotos/Inbox sequentially to avoid IO saturation
    inbox_dir = os.path.join(UPLOAD_DIR, "Inbox")
    os.makedirs(inbox_dir, exist_ok=True)
    
    queued_count = 0
    for path in paths:
        if os.path.exists(path):
            # We copy to Inbox first (Visager's convention for new imports)
            filename = os.path.basename(path)
            dest = os.path.join(inbox_dir, filename)
            
            # Simple deduplication in Inbox
            if os.path.exists(dest):
                base, ext = os.path.splitext(filename)
                dest = os.path.join(inbox_dir, f"{base}_{int(os.path.getmtime(path))}{ext}")
            
            shutil.copy2(path, dest)
            await photo_queue.put(dest)
            queued_count += 1
            
    return {"message": f"Successfully indexed {queued_count} photos.", "total": queued_count}

@app.get("/status")
async def get_status():
    """Returns the current progress of the AI worker."""
    return progress_state

@app.post("/upload")
async def upload_photos(request: Request):
    """
    Direct-to-Disk Streaming Upload (Legacy/Compatibility)
    """
    import time
    start_time = time.time()
    batch_id = int(start_time)
    
    inbox_dir = os.path.join(UPLOAD_DIR, "Inbox")
    os.makedirs(inbox_dir, exist_ok=True)

    # Use getlist to ensure we capture ALL files with the same key
    form = await request.form()
    files = form.getlist('files')
    count = 0
    
    for file in files:
        if isinstance(file, UploadFile):
            file_location = os.path.join(inbox_dir, file.filename)
            print(f"[{batch_id}] Receiving: {file.filename}")
            
            # Direct chunk-based write to disk
            byte_count = 0
            with open(file_location, "wb+") as f:
                while True:
                    chunk = await file.read(1024 * 1024) # 1MB chunks
                    if not chunk:
                        break
                    f.write(chunk)
                    byte_count += len(chunk)
                    if byte_count % (2 * 1024 * 1024) == 0:
                        print(f" [{file.filename}] {byte_count / 1024 / 1024:.0f}MB received")
            
            await photo_queue.put(file_location)
            count += 1
            print(f"[{batch_id}] Saved and Queued: {file.filename}")

    duration = time.time() - start_time
    print(f"[{batch_id}] Batch finished in {duration:.2f}s. Total: {count}")
    return {"message": f"Successfully received {count} photos."}

@app.get("/albums")
def get_albums():
    albums = []
    if not os.path.exists(UPLOAD_DIR): return []
    for item in os.listdir(UPLOAD_DIR):
        path = os.path.join(UPLOAD_DIR, item)
        if os.path.isdir(path) and item not in ["Inbox", "Unsorted", "Needs_Review", "Needs_Name", "Group_Photos"]:
            files = [f for f in os.listdir(path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
            cover = f"/images/{item}/{files[0]}" if files else ""
            albums.append({"name": item, "cover": cover, "count": len(files)})
    return albums

@app.get("/review")
def get_review_items():
    items = []
    
    # Unidentified single faces
    name_dir = os.path.join(UPLOAD_DIR, "Needs_Name")
    if os.path.exists(name_dir):
        for f in os.listdir(name_dir):
            if f.lower().endswith(('.png', '.jpg', '.jpeg')):
                items.append({"src": f"/images/Needs_Name/{f}", "type": "single"})
                
    # Group photos
    group_dir = os.path.join(UPLOAD_DIR, "Group_Photos")
    if os.path.exists(group_dir):
        for f in os.listdir(group_dir):
            if f.lower().endswith(('.png', '.jpg', '.jpeg')):
                items.append({"src": f"/images/Group_Photos/{f}", "type": "group"})
                
    return items

@app.post("/assign")
def assign_name(image_path: str = Form(...), name: str = Form(...)):
    import engine # Lazy Load
    engine.PHOTOS_ROOT = UPLOAD_DIR
    filename = os.path.basename(image_path)
    
    # Check both potential review locations
    if "Needs_Name" in image_path:
        source = os.path.join(UPLOAD_DIR, "Needs_Name", filename)
    elif "Group_Photos" in image_path:
        source = os.path.join(UPLOAD_DIR, "Group_Photos", filename)
    else:
        # Fallback for older data or direct paths
        source = os.path.join(UPLOAD_DIR, "Needs_Review", filename)

    target_dir = os.path.join(UPLOAD_DIR, name)
    os.makedirs(target_dir, exist_ok=True)
    dest = os.path.join(target_dir, filename)
    
    if os.path.exists(source):
        shutil.move(source, dest)
        engine.register_new_person(name, dest)
        return {"status": "success"}
    return {"status": "error", "message": f"Source not found: {source}"}

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    # Check if we should be extra silent (production)
    is_silent = os.environ.get("PYTHON_SILENT") == "1"
    log_level = "critical" if is_silent else "info"
    
    print(f"Backend: Starting server (Silent: {is_silent})...")
    uvicorn.run(
        "main:app", 
        host="127.0.0.1", # Use localhost for local-only safety
        port=8000, 
        reload=False, 
        log_level=log_level,
        workers=1
    )
