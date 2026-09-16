"use client"

import { useEffect, useState } from "react"

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Controlla se l'utente ha già accettato i cookie
    const accepted = localStorage.getItem("cookiesAccepted")
    if (!accepted) setIsVisible(true)
  }, [])

  const acceptCookies = () => {
    localStorage.setItem("cookiesAccepted", "true")
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-xl p-6 max-w-3xl w-[90%] z-50 flex flex-col md:flex-row items-center justify-between gap-4">
      <p className="text-neutral-800 text-sm md:text-base">
        We use cookies to enhance your experience. By continuing to visit this site, you agree to our use of cookies.
      </p>
      <button
        onClick={acceptCookies}
        className="bg-neutral-900 text-white px-5 py-2 rounded-lg hover:bg-neutral-700 transition"
      >
        Accept
      </button>
    </div>
  )
}