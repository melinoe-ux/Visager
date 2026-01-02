import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Image as ImageIcon,
  Users,
  Layout,
  UploadCloud,
  Search,
  Settings,
  ChevronRight,
  Heart
} from 'lucide-react'
import UploadZone from './components/UploadZone'
import Showroom from './components/Showroom'
import ReviewInterface from './components/ReviewInterface'
import PhotoDetail from './components/PhotoDetail'

function App() {
  const [view, setView] = useState('library')
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState(null)

  // New Progress State
  const [procState, setProcState] = useState({
    status: 'idle',
    total_queued: 0,
    processed_count: 0,
    current_file: ''
  })
  const [searchQuery, setSearchQuery] = useState('')

  const pollStatus = async () => {
    try {
      const res = await fetch('http://localhost:8000/status')
      const data = await res.json()
      setProcState(data)

      if (data.status !== 'idle') {
        const percent = Math.round((data.processed_count / data.total_queued) * 100)
        setProgress(percent)
        setTimeout(pollStatus, 500)
      } else {
        setUploading(false)
        setStatus('Success: Library Updated')
        setTimeout(() => setStatus(null), 5000)
        // Refresh photos after indexing
        const photosRes = await fetch('http://localhost:8000/photos')
        const photosData = await photosRes.json()
        setPhotos(photosData)
      }
    } catch (err) {
      console.error("Poll Error:", err)
      setUploading(false)
    }
  }

  const handleNativePick = async () => {
    if (!window.electron) {
      setStatus("Error: Native file picker only available in Visager Desktop app.")
      return
    }
    const paths = await window.electron.selectFiles()
    if (paths && paths.length > 0) {
      handleFiles(null, paths)
    }
  }

  const handleFiles = async (files, directPaths = null) => {
    let paths = directPaths

    if (!paths && files) {
      // Fallback/Drag-and-Drop: Extract real paths (Electron-only)
      paths = Array.from(files).map(f => f.path).filter(p => !!p)
    }

    if (!paths || !paths.length) {
      setStatus("Error: No file paths found. Please use the selection button.")
      return
    }

    setUploading(true)
    setProgress(0)
    setStatus('Indexing...')
    setProcState({ status: 'indexing', total_queued: paths.length, processed_count: 0, current_file: '' })

    try {
      const response = await fetch('http://localhost:8000/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paths)
      })

      if (response.ok) {
        pollStatus()
      } else {
        setStatus(`Error: ${response.status}`)
        setUploading(false)
      }
    } catch (err) {
      setStatus('Error: Network Request Failed')
      setUploading(false)
    }
  }

  const navItems = [
    { id: 'library', label: 'Library', icon: ImageIcon },
    { id: 'people', label: 'People', icon: Users },
    { id: 'albums', label: 'Albums', icon: Layout },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'upload', label: 'Upload', icon: UploadCloud },
  ]

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans">
      <div className="titlebar-drag fixed top-0 left-0 right-0 h-10 z-[100]" />

      {/* Sidebar - Mac Style Glass */}
      <aside className="w-64 glass-dark h-full flex flex-col pt-12 px-4 z-50 border-r border-white/5">
        <div className="px-4 mb-8">
          <h1 className="text-xl font-semibold tracking-tight text-white/90">Visager</h1>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = view === item.id
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 no-drag group ${isActive
                  ? 'bg-white/10 text-white shadow-lg'
                  : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                  }`}
              >
                <Icon size={18} className={`${isActive ? 'text-blue-400' : 'text-inherit'} transition-colors`} />
                <span className="text-sm font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="ml-auto"
                  >
                    <ChevronRight size={14} className="text-white/30" />
                  </motion.div>
                )}
              </button>
            )
          })}
        </nav>

        {/* Global Progress in Sidebar Footer */}
        {uploading && (
          <div className="mb-8 p-4 aura-card no-drag">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">
                {procState.status === 'indexing' ? 'Indexing' : 'Analyzing'}
              </span>
              <span className="text-[10px] text-white/40">{progress}%</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              />
            </div>
            {procState.status === 'analyzing' && (
              <p className="text-[9px] text-white/30 mt-2 truncate">Queued ({procState.processed_count}/{procState.total_queued})</p>
            )}
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        <header className="sticky top-0 z-40 px-8 pt-12 pb-6 flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto">
            <h2 className="text-3xl font-bold tracking-tight capitalize">{view}</h2>
          </div>

          <div className="flex items-center gap-4 pointer-events-auto no-drag">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-400 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search moments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-full pl-10 pr-6 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white/10 transition-all w-64 backdrop-blur-md"
              />
            </div>
            <button className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <Settings size={18} className="text-white/60" />
            </button>
          </div>
        </header>

        <div className="px-8 pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, y: -10 }}
              transition={{ duration: 0.4, cubicBezier: [0.4, 0, 0.2, 1] }}
            >
              {view === 'library' && (
                <Showroom
                  photos={photos}
                  setPhotos={setPhotos}
                  onPhotoClick={setSelectedPhoto}
                />
              )}
              {view === 'people' && <ReviewInterface />}
              {view === 'albums' && (
                <div className="flex flex-col items-center justify-center py-20 text-white/20">
                  <Layout size={64} strokeWidth={1} />
                  <p className="mt-4 font-medium">Coming to Visager soon</p>
                </div>
              )}
              {view === 'favorites' && (
                <div className="flex flex-col items-center justify-center py-20 text-white/20">
                  <Heart size={64} strokeWidth={1} />
                  <p className="mt-4 font-medium">Favorite moments will appear here</p>
                </div>
              )}
              {view === 'upload' && (
                <UploadZone
                  uploading={uploading}
                  progress={progress}
                  status={status}
                  onUpload={handleFiles}
                  onNativePick={handleNativePick}
                  procState={procState}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Fullscreen Photo Detail Overlay */}
      <AnimatePresence>
        {selectedPhoto && (
          <PhotoDetail
            photo={selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
            onNext={() => {
              const idx = photos.findIndex(p => p.id === selectedPhoto.id)
              if (idx < photos.length - 1) setSelectedPhoto(photos[idx + 1])
            }}
            onPrev={() => {
              const idx = photos.findIndex(p => p.id === selectedPhoto.id)
              if (idx > 0) setSelectedPhoto(photos[idx - 1])
            }}
          />
        )}
      </AnimatePresence>

      {/* Persistence / Notification overlay */}
      {status && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-8 right-8 z-[100] px-6 py-3 glass rounded-2xl shadow-2xl border border-white/20"
        >
          <p className="text-sm font-medium text-white/90">{status}</p>
        </motion.div>
      )}
    </div>
  )
}

export default App
