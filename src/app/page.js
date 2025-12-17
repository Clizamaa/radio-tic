"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Landing() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Estados para el flujo de nickname
  const [step, setStep] = useState("initial"); // "initial" | "nickname"
  const [action, setAction] = useState(null); // "create" | "join"
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    if (searchParams.get("error") === "room_not_found") {
      setError("La sala no existe.");
    }
    // Cargar nickname guardado
    const saved = localStorage.getItem("radio_nickname");
    if (saved) setNickname(saved);
  }, [searchParams]);

  function startCreateRoom() {
    setError(null);
    setAction("create");
    setStep("nickname");
  }

  function startJoinRoom() {
    if (!code.trim()) return;
    setError(null);
    setAction("join");
    setStep("nickname");
  }

  async function handleContinue() {
    if (!nickname.trim()) {
      setError("Por favor ingresa un nickname.");
      return;
    }
    localStorage.setItem("radio_nickname", nickname.trim());
    
    if (action === "create") {
      await createRoom();
    } else if (action === "join") {
      await joinRoom();
    }
  }

  async function createRoom() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/room/create", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        // Guardar token de administrador para esta sala
        if (data.adminToken) {
          localStorage.setItem(`radio_admin_${data.code}`, data.adminToken);
        }
        router.push(`/${data.code}`);
      } else {
        setError("Error al crear la sala.");
        setLoading(false);
      }
    } catch (err) {
      setError("Error de conexión.");
      setLoading(false);
    }
  }

  async function joinRoom() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/room/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        router.push(`/${code.trim()}`);
      } else {
        setError("Código de sala inválido.");
        setLoading(false);
      }
    } catch (err) {
      setError("Error de conexión.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100 p-4 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-500/10 via-zinc-50/0 to-zinc-50/0 dark:from-violet-900/20 dark:via-black/0 dark:to-black/0 pointer-events-none" />
      
      <main className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <img src="/Image_6.png" alt="Radio Logo" className="w-28 h-28 object-contain drop-shadow-xl transform rotate-3 hover:rotate-6 transition-transform duration-300" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Radio SharshaSoft</h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            {step === "initial" 
              ? "Tu propia estación de radio colaborativa."
              : "Casi listo, dinos cómo llamarte."}
          </p>
        </div>

        <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-8">
          {step === "initial" ? (
            <>
              <div className="space-y-4">
                <button
                  onClick={startCreateRoom}
                  className="w-full py-4 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-violet-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Crear Nueva Sala
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-widest font-semibold">
                    <span className="bg-transparent px-4 text-zinc-400">
                      o únete
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Código de sala (ej. A1B2C3)"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-black/50 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none text-center font-mono text-lg tracking-widest uppercase transition-all"
                    maxLength={6}
                  />
                  <button
                    onClick={startJoinRoom}
                    disabled={!code.trim()}
                    className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
                  >
                    Entrar a Sala
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Tu Nickname</label>
                <input
                  type="text"
                  placeholder="Ej. Juanito"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-black/50 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none text-lg transition-all"
                  onKeyDown={(e) => e.key === "Enter" && handleContinue()}
                  autoFocus
                />
              </div>
              
              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setStep("initial")}
                  className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 rounded-xl font-bold transition-colors"
                >
                  Volver
                </button>
                <button
                  onClick={handleContinue}
                  disabled={loading || !nickname.trim()}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
                >
                  {loading ? (action === "create" ? "Creando..." : "Entrando...") : "Continuar"}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl text-sm text-center font-medium animate-pulse">
              {error}
            </div>
          )}
        </div>
      </main>
      
      <footer className="absolute bottom-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
        © 2025 SharshaSoft. Todos los derechos reservados.
      </footer>
    </div>
  );
}
