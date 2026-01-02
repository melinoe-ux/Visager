import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Check, X } from 'lucide-react'

export default function ReviewInterface() {
    const [items, setItems] = useState([])
    const [nameInput, setNameInput] = useState('')
    const [selectedId, setSelectedId] = useState(null)

    const fetchItems = () => {
        fetch('http://localhost:8000/review')
            .then(res => res.json())
            .then(data => setItems(data))
    }

    useEffect(() => {
        fetchItems()
    }, [])

    const handleAssign = async (imagePath) => {
        if (!nameInput.trim()) return

        const formData = new FormData()
        formData.append('image_path', imagePath)
        formData.append('name', nameInput)

        await fetch('http://localhost:8000/assign', {
            method: 'POST',
            body: formData
        })

        setNameInput('')
        setSelectedId(null)
        fetchItems()
    }

    return (
        <div className="space-y-12">
            <section>
                <div className="flex items-center justify-between mb-8 px-1">
                    <div>
                        <h3 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-1">Unidentified People</h3>
                        <p className="text-3xl font-bold tracking-tight">Name your friends</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-10">
                    <AnimatePresence>
                        {items.filter(i => i.type === 'single').map((img, index) => {
                            const isSelected = selectedId === img.src
                            return (
                                <motion.div
                                    key={img.src}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="flex flex-col items-center group relative no-drag"
                                >
                                    <div
                                        onClick={() => setSelectedId(img.src)}
                                        className={`relative w-28 h-28 md:w-32 md:h-32 rounded-full cursor-pointer transition-all duration-500 p-1.5 ${isSelected ? 'ring-2 ring-blue-500 scale-105 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'ring-1 ring-white/10 hover:ring-white/30'
                                            }`}
                                    >
                                        <img
                                            src={`http://localhost:8000${img.src}`}
                                            className="w-full h-full object-cover rounded-full aura-card"
                                            alt="New face detected"
                                        />
                                        <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <UserPlus size={24} className="text-white drop-shadow-lg" />
                                        </div>
                                    </div>

                                    {isSelected ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-4 w-full max-w-[160px] glass p-2 rounded-2xl flex flex-col gap-2 z-10 shadow-2xl"
                                        >
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Name this album"
                                                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500/50"
                                                value={nameInput}
                                                onChange={(e) => setNameInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAssign(img.src)}
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAssign(img.src)}
                                                    className="flex-1 bg-blue-600 p-1.5 rounded-lg flex items-center justify-center hover:bg-blue-500 transition-colors"
                                                >
                                                    <Check size={14} />
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedId(null); setNameInput(''); }}
                                                    className="flex-1 bg-white/5 p-1.5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="text-center">
                                            <p className="mt-3 text-xs font-semibold text-blue-400 tracking-wide uppercase">New Face</p>
                                            <p className="text-[10px] text-white/30 truncate max-w-[100px] mt-0.5">Identify now</p>
                                        </div>
                                    )}
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            </section>

            {/* Special Section for Group Photos */}
            {items.some(i => i.type === 'group') && (
                <section className="pt-12 border-t border-white/5">
                    <div className="mb-8">
                        <h3 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-1">Group Discoveries</h3>
                        <p className="text-3xl font-bold tracking-tight">Gather your groups</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {items.filter(i => i.type === 'group').map((img) => {
                            const isSelected = selectedId === img.src
                            return (
                                <motion.div
                                    key={img.src}
                                    className="relative rounded-[32px] overflow-hidden group border border-white/5 hover:border-white/20 transition-all duration-500"
                                >
                                    <img
                                        src={`http://localhost:8000${img.src}`}
                                        className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-6 flex flex-col justify-end">
                                        <div className="flex items-center justify-between gap-4">
                                            {isSelected ? (
                                                <div className="flex-1 flex gap-2">
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        placeholder="Group album name..."
                                                        className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                                        value={nameInput}
                                                        onChange={(e) => setNameInput(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleAssign(img.src)}
                                                    />
                                                    <button onClick={() => handleAssign(img.src)} className="bg-blue-600 px-4 rounded-xl hover:bg-blue-500 transition-colors">
                                                        <Check size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-blue-400 mb-1">Multiple people detected</p>
                                                        <button
                                                            onClick={() => setSelectedId(img.src)}
                                                            className="text-white font-medium hover:text-blue-400 transition-colors"
                                                        >
                                                            Create Group Album
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </section>
            )}

            {items.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center glass rounded-3xl border-dashed border-white/10 grayscale opacity-40">
                    <Check size={48} className="text-white mb-4" />
                    <p className="font-medium text-white/40">Everyone is recognized</p>
                </div>
            )}
        </div>
    )
}
