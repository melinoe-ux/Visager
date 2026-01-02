# Visager 📸

**Visager** is a professional, local-first AI photo organizer designed for macOS. It automatically indexes your local photos, detects faces using advanced AI, and organizes them into intelligent albums—all without your data ever leaving your machine.

![Visager Screenshot](preview_placeholder.png)

## ✨ Key Features

- **Local-First Privacy**: No cloud processing. All AI analysis happens on your CPU.
- **Advanced Face Recognition**: Uses DeepFace and RetinaFace for high-accuracy identification.
- **Professional macOS UI**: A glassmorphic, content-first interface inspired by the latest macOS aesthetics.
- **Silent Background Engine**: The Python AI core runs invisibly, perfectly synced with the Electron UI.
- **Native Experience**: Packaged as a standalone `.app` with native file dialogs and window controls.

## 🚀 Getting Started

### For Users
1. Download the latest **Visager.zip** from the [Releases](https://github.com/melinoe-ux/visager/releases) section.
2. Unzip and drag **Visager.app** to your Applications folder.
3. Launch and select your photo directory to begin indexing.

### For Developers

#### Prerequisites
- Node.js & npm
- Python 3.9+ 
- Virtual environment (`venv`)

#### Installation
1. **Clone the repo**:
   ```bash
   git clone https://github.com/melinoe-ux/visager.git
   cd visager
   ```

2. **Setup Backend**:
   ```bash
   python3 -m venv venv312
   source venv312/bin/activate
   pip install -r backend/requirements.txt
   ```

3. **Setup Frontend**:
   ```bash
   cd frontend
   npm install
   ```

#### Running in Development
```bash
# In the frontend directory
npm run electron-dev
```

## 🏗️ Architecture

- **Frontend**: React + Vite + Tailwind CSS
- **Shell**: Electron (with custom IPC bridge for native features)
- **Backend**: Python (FastAPI)
- **AI Engine**: TensorFlow, DeepFace (ArcFace, RetinaFace)
- **Packaging**: PyInstaller (Backend) & Electron Forge (App Bundle)

## 📦 Building for Production

To create the standalone `.app` bundle:

1. **Build Python Engine**:
   ```bash
   ./backend/build_engine.sh
   ```

2. **Build and Package Electron**:
   ```bash
   cd frontend
   npm run build
   npm run make
   ```

## 📄 License
MIT License - See [LICENSE](LICENSE) for details.

---
*Created with ❤️ for professional photo management.*
