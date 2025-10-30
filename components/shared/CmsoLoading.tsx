"use client";
import { motion } from "framer-motion";
import Image from "next/image"

export default function CmsoLoading(){
    return (
        <main className="min-h-screen bg-white flex items-center justify-center" aria-label="Carregando conteúdo">
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
        >
            <Image
            src="/images/logo.png"
            alt="CMSO 360°"
            width={160}
            height={64}
            className="h-16 w-auto mb-4"
            priority
            />
            <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
                className="h-1 bg-gradient-to-r from-[#104e35] to-[#a6ce39] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
            />
            <p className="text-gray-600 text-sm mt-4">Carregando...</p>
            </div>
            
        </motion.div>
        </main>
    )
}