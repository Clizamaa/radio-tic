"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminPanel() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null); // Para ver detalles/integrantes
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === "chris" && password === "Soporte..") {
      setIsAuthenticated(true);
      setLoginError("");
      // Opcional: guardar en sessionStorage para persistir solo en la pestaña
      sessionStorage.setItem("admin_auth", "true");
    } else {
      setLoginError("Credenciales inválidas");
    }
  };

  useEffect(() => {
    // Check session on mount
    if (sessionStorage.getItem("admin_auth") === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/rooms");
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRooms();
      const interval = setInterval(fetchRooms, 10000); // Auto-refresh cada 10s
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleDelete = async (code) => {
    if (!confirm(`¿Estás seguro de eliminar la sala ${code}?`)) return;
    try {
      await fetch("/api/admin/rooms", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: code }),
      });
      fetchRooms();
      if (selectedRoom?.code === code) setSelectedRoom(null);
    } catch (e) {
      alert("Error al eliminar");
    }
  };

  const handleClearQueue = async (code) => {
    if (!confirm(`¿Limpiar la cola de reproducción de ${code}?`)) return;
    try {
      await fetch("/api/admin/rooms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: code, action: "clear_queue" }),
      });
      fetchRooms();
      alert("Cola limpiada");
    } catch (e) {
      alert("Error al limpiar cola");
    }
  };

  const formatTime = (ms) => {
    if (!ms) return "-";
    const min = Math.floor((Date.now() - ms) / 60000);
    if (min < 60) return `${min} min`;
    const hours = Math.floor(min / 60);
    return `${hours}h ${min % 60}m`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-violet-500/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900/50 border border-white/5 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-8">
            <img src="/Image_6.png" alt="Radio Logo" className="w-16 h-16 object-contain drop-shadow-lg mx-auto mb-4" />
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              Admin Access
            </h1>
            <p className="text-zinc-500 text-sm mt-2">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
                placeholder="Ingresa tu usuario"
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-violet-500/20 transition-all transform active:scale-[0.98] mt-2"
            >
              Ingresar
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-violet-500/30">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-zinc-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/Image_6.png" alt="Radio Logo" className="w-10 h-10 object-contain drop-shadow-lg" />
            <span className="font-bold text-lg tracking-tight">RadioAdmin</span>
          </div>
          <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
            Gestión de Salas
          </h1>
          <button 
            onClick={fetchRooms}
            className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {loading && rooms.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">Cargando salas...</div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No hay salas activas</h3>
            <p className="text-zinc-500">Las salas creadas aparecerán aquí.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {rooms.map((room) => (
              <div 
                key={room.code}
                className="group relative bg-zinc-900/50 border border-white/5 rounded-xl p-3 hover:bg-zinc-900 transition-all hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-wider font-mono">
                      {room.code}
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1">
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatTime(room.createdAt)}
                    </p>
                  </div>
                  <div className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${room.nowPlaying ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
                    {room.nowPlaying ? 'Play' : 'Idle'}
                  </div>
                </div>

                <div className="space-y-2">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-zinc-950/50 p-2 rounded-lg border border-white/5">
                      <div className="text-[10px] text-zinc-500 mb-0.5">Cola</div>
                      <div className="text-sm font-bold text-white">{room.queueLength}</div>
                    </div>
                    <div className="bg-zinc-950/50 p-2 rounded-lg border border-white/5">
                      <div className="text-[10px] text-zinc-500 mb-0.5">Users</div>
                      <div className="text-sm font-bold text-white">{room.memberCount}</div>
                    </div>
                  </div>

                  {/* Now Playing Mini */}
                  {room.nowPlaying && (
                    <div className="flex items-center gap-2 bg-zinc-950/30 p-1.5 rounded-lg border border-white/5">
                      {room.nowPlaying.thumbnailUrl && (
                        <img src={room.nowPlaying.thumbnailUrl} alt="cover" className="w-8 h-8 rounded object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-white truncate">{room.nowPlaying.title}</p>
                        <p className="text-[9px] text-zinc-500 truncate">{room.nowPlaying.nickname}</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-1.5 mt-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => setSelectedRoom(room)}
                      className="flex-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-medium rounded transition-colors"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => handleClearQueue(room.code)}
                      className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 text-[10px] font-medium rounded transition-colors"
                      title="Limpiar cola"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(room.code)}
                      className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-[10px] font-medium rounded transition-colors"
                      title="Eliminar sala"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de Detalles */}
      {selectedRoom && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Sala {selectedRoom.code}</h2>
                <p className="text-sm text-zinc-500">Detalles e Integrantes</p>
              </div>
              <button 
                onClick={() => setSelectedRoom(null)}
                className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Info General */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-950 p-4 rounded-xl">
                  <div className="text-xs text-zinc-500 mb-1">Última Actividad</div>
                  <div className="text-sm font-medium text-white">{formatTime(selectedRoom.lastActive)}</div>
                </div>
                <div className="bg-zinc-950 p-4 rounded-xl">
                  <div className="text-xs text-zinc-500 mb-1">Total Canciones</div>
                  <div className="text-sm font-medium text-white">{selectedRoom.queueLength + (selectedRoom.nowPlaying ? 1 : 0)}</div>
                </div>
              </div>

              {/* Lista de Integrantes */}
              <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">
                  Integrantes Recientes ({selectedRoom.members.length})
                </h3>
                {selectedRoom.members.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedRoom.members.map((member, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-zinc-800/50 p-2 rounded-lg border border-white/5">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                          {member.substring(0, 2)}
                        </div>
                        <span className="text-sm text-zinc-300 truncate">{member}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-600 italic">No se han registrado integrantes activos aún.</p>
                )}
              </div>
            </div>

            <div className="p-4 bg-zinc-950 border-t border-white/5 flex justify-end">
              <button 
                onClick={() => setSelectedRoom(null)}
                className="px-4 py-2 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}