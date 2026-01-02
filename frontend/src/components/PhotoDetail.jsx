import { motion, AnimatePresence } from 'framer-motion'
import { X, Info, Share, Trash2, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'
import { useState } from 'react'

export default function PhotoDetail({ photo, onClose, onNext, onPrev }) {
    const [showInfo, setShowInfo] = useState(false)

    if (!photo) return null

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex items-center justify-center overflow-hidden"
        >
            <div className="absolute top-0 left-0 right-0 h-20 flex items-center justify-between px-6 z-[210] pointer-events-none">
                <div className="flex items-center gap-4 pointer-events-auto">
                    <button
                        onClick={onClose}
                        className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all no-drag"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white/90">{photo.name || 'Untitled'}</span>
                        <span className="text-[10px] font-medium text-white/30 uppercase tracking-widest">Aura Inspector</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                    <button className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                        <Share size={20} className="text-white/70" />
                    </button>
                    <button
                        onClick={() => setShowInfo(!showInfo)}
                        className={`p-2.5 rounded-full border transition-all ${showInfo ? 'bg-blue-500 border-blue-400 text-white' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
                    >
                        <Info size={20} />
                    </button>
                    <button className="p-2.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all ml-4">
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {/* Main Image View */}
            <div className="relative w-full h-full flex items-center justify-center p-12 md:p-24 group">
                <motion.img
                    layoutId={`photo-${photo.id}`}
                    src={photo.src}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                />

                {/* Bounding Box Highlights (Mockup) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* In a real scenario, we'd map over detected faces */}
                    <div className="w-32 h-32 border-2 border-blue-400/50 rounded-2xl absolute opacity-0 group-hover:opacity-100 transition-opacity bg-blue-400/10 backdrop-blur-sm" style={{ top: '30%', left: '45%' }}>
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 rounded-full text-[10px] font-bold text-white whitespace-nowrap shadow-lg">
                            Identified Person
                        </div>
                    </div>
                </div>

                {/* Navigation Controls */}
                <button
                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                    className="absolute left-8 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white/30 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                >
                    <ChevronLeft size={32} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                    className="absolute right-8 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white/30 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                >
                    <ChevronRight size={32} />
                </button>
            </div>

            {/* Info Sidebar (Metadata Drawer) */}
            <AnimatePresence>
                {showInfo && (
                    <motion.aside
                        initial={{ x: 400 }}
                        animate={{ x: 0 }}
                        exit={{ x: 400 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                        className="w-96 glass-dark h-full absolute right-0 top-0 z-[220] border-l border-white/10 p-8 pt-24"
                    >
                        <h3 className="text-xl font-bold mb-6">Information</h3>

                        <div className="space-y-8">
                            <section className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white/40">Captured</span>
                                    <span className="text-white/80 font-medium">January 2, 2026</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white/40">Resolution</span>
                                    <span className="text-white/80 font-medium">4032 × 3024</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white/40">File Size</span>
                                    <span className="text-white/80 font-medium">4.2 MB</span>
                                </div>
                            </section>

                            <div className="h-px bg-white/5" />

                            <section>
                                <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Detected People</h4>
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex items-center gap-2 p-1 pr-3 bg-white/5 rounded-full border border-white/10">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 overflow-hidden">
                                            {/* Face thumbnail mockup */}
                                            <img src={photo.src} className="w-full h-full object-cover" />
                                        </div>
                                        <span className="text-xs font-semibold">Arda</span>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">AI Analysis</h4>
                                <div className="aura-card p-4 space-y-3">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-white/40">Face Match Confidence</span>
                                        <span className="text-blue-400 font-bold">94.2%</span>
                                    </div>
                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[94%]" />
                                    </div>
                                </div>
                            </section>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
