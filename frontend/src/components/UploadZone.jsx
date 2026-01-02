import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, File, CheckCircle2, AlertCircle } from 'lucide-react'

export default function UploadZone({ uploading, progress, status, onUpload, onNativePick, procState }) {
    const fileInputRef = useRef(null)
    const [isDragOver, setIsDragOver] = useState(false)

    const isError = status && status.includes('Error')
    const isSuccess = status && status.includes('Success')
    const isElectron = window.electron?.isElectron

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-12 max-w-4xl mx-auto px-4">
            {!isElectron && (
                <div className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-200 text-sm font-medium flex items-center justify-center gap-2">
                    <AlertCircle size={16} />
                    Visager requires the Desktop app for local indexing.
                </div>
            )}
            <div className="text-center space-y-4">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-bold tracking-tight"
                >
                    Expand your collections.
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-white/40 text-lg"
                >
                    Drag and drop photos directly into your library.
                </motion.p>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    backgroundColor: isDragOver ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)'
                }}
                className={`w-full h-80 border-2 border-dashed rounded-[40px] flex flex-col items-center justify-center transition-all cursor-pointer glass relative overflow-hidden group ${isDragOver ? 'border-blue-500/50 scale-[1.02]' : 'border-white/10 hover:border-white/20'
                    }`}
                onClick={() => !uploading && onNativePick()}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                    e.preventDefault()
                    setIsDragOver(false)
                    if (!uploading) onUpload(e.dataTransfer.files)
                }}
            >
                <div className="relative pointer-events-none">
                    <AnimatePresence mode="wait">
                        {uploading ? (
                            <motion.div
                                key="uploading"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex flex-col items-center"
                            >
                                <div className="p-6 bg-blue-500/10 rounded-full mb-6 relative">
                                    <UploadCloud size={48} className="text-blue-400 animate-bounce" />
                                    <motion.div
                                        className="absolute inset-0 border-4 border-blue-500 rounded-full"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: progress / 100 }}
                                        style={{ rotate: -90 }}
                                    />
                                </div>
                                <p className="text-2xl font-bold tracking-tight">
                                    {procState.status === 'analyzing' ? `Queued (${procState.processed_count}/${procState.total_queued})` : `${progress}%`}
                                </p>
                                <p className="text-sm text-white/40 mt-1 uppercase tracking-widest font-semibold">
                                    {procState.status === 'indexing' ? 'Indexing...' : 'Analyzing faces...'}
                                </p>
                                {procState.current_file && (
                                    <p className="text-[10px] text-white/20 mt-4 font-mono truncate max-w-[200px]">
                                        {procState.current_file}
                                    </p>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex flex-col items-center"
                            >
                                <div className="p-6 bg-white/5 rounded-[32px] mb-6 group-hover:bg-white/10 transition-colors">
                                    <File size={48} className="text-white/40 group-hover:text-white/60 transition-colors" />
                                </div>
                                <p className="text-xl font-medium text-white/60">Choose your moments</p>
                                <p className="text-sm text-white/30 mt-2">Maximum privacy. Local-only processing.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {uploading && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/5">
                        <motion.div
                            className="h-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </motion.div>

            <AnimatePresence>
                {status && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={`flex items-center gap-3 px-6 py-4 rounded-3xl glass border shadow-2xl ${isError ? 'border-red-500/20 bg-red-500/5 text-red-200' : 'border-green-500/20 bg-green-500/5 text-green-200'
                            }`}
                    >
                        {isError ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                        <p className="text-sm font-medium">{status}</p>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    )
}
