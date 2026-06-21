import { motion } from 'framer-motion'

function RankBadge({ color, glow }: { color: string; glow: string }) {
    return (
        <motion.div
            className="absolute -top-3 -left-2 z-10"
            style={{ filter: `drop-shadow(0 3px 8px ${glow})` }}
            animate={{ scale: [1, 1.22, 1] }}
            transition={{
                duration: 0.75,
                repeat: Infinity,
                repeatDelay: 1.2,
                ease: [0.4, 0, 0.2, 1],
            }}
            whileHover={{ scale: 1.4 }}
        >
            <svg
                width="26"
                height="24"
                viewBox="0 0 30 27"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M15 25C15 25 2 17 2 9C2 5.69 4.69 3 8 3C10.5 3 12.65 4.45 13.82 6.55C14.22 7.27 14.6 7.5 15 7.5C15.4 7.5 15.78 7.27 16.18 6.55C17.35 4.45 19.5 3 22 3C25.31 3 28 5.69 28 9C28 17 15 25 15 25Z"
                    fill={color}
                    stroke="rgba(0,0,0,0.15)"
                    strokeWidth="1"
                />
            </svg>
        </motion.div>
    )
}

export default RankBadge
