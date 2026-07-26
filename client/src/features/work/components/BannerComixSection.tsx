export default function ComixLists() {
    return (
        <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
            {/* // reading reminder banner ---- */}
            <main className="relative mx-auto h-[118px] w-full max-w-[1360px] overflow-hidden rounded-2xl bg-gradient-to-r from-[#55b7ff] via-[#c6c0a8] to-[#ffad3d] shadow-sm">
                {/* //// mascot image ---- */}
                <img
                    src="/riri_body_1.png"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="
                        pointer-events-none
                        absolute
                        bottom-[-58px]
                        left-[7%]
                        h-[175px]
                        w-auto
                        select-none
                        object-contain
                        sm:left-[9%]
                        md:h-[190px]
                        lg:left-[11%]
                    "
                />

                {/* //// banner message ---- */}
                <div
                    className="
                        relative
                        z-10
                        flex
                        h-full
                        items-center
                        justify-center
                        ms-[20%]
                    "
                >
                    <h1
                        className="
                            text-center
                            text-[32px]
                            font-medium
                            uppercase
                            leading-[1.25]
                            tracking-[0.025em]
                            text-black
                            sm:text-[16px]
                            md:text-[32px]
                        "
                    >
                        Enjoy Reading? Don&apos;t Forget
                        <br />
                        To Click Favorite 💗
                    </h1>
                </div>
            </main>
        </div>
    )
}
