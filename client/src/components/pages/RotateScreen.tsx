import { motion } from 'framer-motion'

export default function RotateScreen() {
    return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-background gap-10">
            {/* Phone rotating animation */}
            <motion.div
                animate={{ rotate: [90, 0] }}
                transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut',
                }}
                className="origin-center"
            >
                <div className="relative w-24 h-40 border-2 border-foreground rounded-xl flex items-center justify-center">
                    <div className="w-16 h-32 bg-muted rounded-lg" />
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-muted-foreground/30 rounded-full" />
                </div>
            </motion.div>

            {/* Text */}
            <div className="text-center space-y-1.5">
                <h1 className="text-base font-medium text-foreground">Rotate your device</h1>
                <p className="text-sm text-muted-foreground">
                    This page is best viewed in portrait.
                </p>
            </div>
        </div>
    )
}
