import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Folder, Image as ImageIcon } from 'lucide-react'

export default function Showroom({ photos, setPhotos, onPhotoClick }) {
    const [albums, setAlbums] = useState([])

    useEffect(() => {
        // Fetch albums
        fetch('http://localhost:8000/albums')
            .then(res => res.json())
            .then(data => setAlbums(data))
            .catch(err => console.error("Failed to fetch albums", err))

        // Fetch all photos for the unified grid
        fetch('http://localhost:8000/photos')
            .then(res => res.json())
            .then(data => setPhotos(data))
            .catch(err => console.error("Failed to fetch photos", err))
    }, [setPhotos])

    return (
        <div className="space-y-16">
            {/* Unified Library Grid - iOS 26 Style */}
            <section>
                <div className="flex items-center justify-between mb-8 px-1">
                    <div>
                        <h3 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-1">Library</h3>
                        <p className="text-3xl font-bold tracking-tight">All Photos</p>
                    </div>
                </div>

                <div className="ios-grid">
                    {photos.map((photo, index) => (
                        <motion.div
                            key={photo.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.01 }}
                            onClick={() => onPhotoClick(photo)}
                            className="aspect-square aura-card overflow-hidden cursor-pointer group relative"
                        >
                            <img
                                src={photo.src}
                                alt={photo.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                            />
                            {/* Analyzing... Badge (Mockup) */}
                            {index < 3 && (
                                <div className="absolute top-2 right-2 glass px-2 py-0.5 rounded-full flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                                    <span className="text-[8px] font-bold uppercase text-blue-400">Analysing</span>
                                </div>
                            )}
                        </motion.div>
                    ))}

                    {photos.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center glass rounded-3xl border-dashed border-white/10 grayscale opacity-40">
                            <ImageIcon size={48} className="text-white mb-4" />
                            <p className="font-medium text-white/40">Your library is currently empty</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Albums Section */}
            <section className="pb-20">
                <div className="flex items-center justify-between mb-8 px-1">
                    <div>
                        <h3 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-1">Curation</h3>
                        <p className="text-3xl font-bold tracking-tight">Collections</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {albums.map((album, index) => (
                        <motion.div
                            key={album.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + (index * 0.05) }}
                            className="group cursor-pointer"
                        >
                            <div className="aspect-[4/3] rounded-[32px] overflow-hidden mb-4 relative aura-card shadow-2xl">
                                {album.cover ? (
                                    <img
                                        src={`http://localhost:8000${album.cover}`}
                                        alt={album.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 text-white/20">
                                        <Folder size={48} strokeWidth={1} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-6">
                                    <p className="text-xs font-semibold tracking-wide uppercase">Explore Album</p>
                                </div>
                            </div>

                            <div className="px-2">
                                <h4 className="text-lg font-bold text-white/90 group-hover:text-white transition-colors truncate">{album.name}</h4>
                                <p className="text-sm text-white/30 font-medium">{album.count} items</p>
                            </div>
                        </motion.div>
                    ))}

                    {albums.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center glass rounded-3xl border-dashed border-white/10">
                            <Folder size={48} className="text-white/10 mb-4" />
                            <p className="text-white/30 font-medium">No collections discovered yet</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
