
"use client"

import { create } from "zustand"

type Role = "admin" | "member" | null

interface AuthState {
  user: { name: string; role: Role } | null
  login: (role: Role) => void
  logout: () => void
}

import { createStore } from "zustand/vanilla"
import { useStore } from "zustand"

// Simplified for simulation
export const authStore = create<AuthState>((set) => ({
  user: null,
  login: (role) => set({ user: { name: role === "admin" ? "Coordenador" : "Voluntário", role } }),
  logout: () => set({ user: null }),
}))

export function useAuth() {
  return authStore()
}
