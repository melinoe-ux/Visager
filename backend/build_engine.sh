#!/bin/bash

# Configuration
PROJECT_ROOT=$(pwd)
VENV_PYTHON="${PROJECT_ROOT}/venv312/bin/python3"
BACKEND_DIR="${PROJECT_ROOT}/backend"
MAIN_SCRIPT="${BACKEND_DIR}/main.py"
ENGINE_NAME="VisagerEngine"

echo "--- Starting Visager Backend Build ---"

# Move to backend directory
cd "${BACKEND_DIR}"

# Run PyInstaller
# --windowed: No terminal window
# --onefile: Single executable
# --name: Specific binary name
# --add-data: DeepFace often needs its weights/models, but here we expect them locally or downloaded at runtime.
# We include engine.py implicitly as it's imported.

"${VENV_PYTHON}" -m PyInstaller \
    --noconfirm \
    --onefile \
    --windowed \
    --name "${ENGINE_NAME}" \
    --clean \
    "${MAIN_SCRIPT}"

echo "--- Build Complete: ${BACKEND_DIR}/dist/${ENGINE_NAME} ---"
