import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CommandPalette } from '@/components/CommandPalette'
import { NewOrderDialog } from '@/components/NewOrderDialog'
import { useAuth } from '@/components/AuthProvider'

type PaletteState = {
  openPalette: () => void
  closePalette: () => void
  togglePalette: () => void
  openNewOrder: () => void
}

const PaletteContext = createContext<PaletteState | null>(null)

/**
 * Estado global da paleta de comandos (Ctrl+K) e do modal de novo pedido
 * acionado por atalho — permite que qualquer componente do shell abra a
 * paleta (ex.: botão "Encontrar" no footer da sidebar).
 */
export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [newOrderOpen, setNewOrderOpen] = useState(false)

  const canWrite = profile?.role !== 'designer'

  const value = useMemo<PaletteState>(
    () => ({
      openPalette: () => setPaletteOpen(true),
      closePalette: () => setPaletteOpen(false),
      togglePalette: () => setPaletteOpen((v) => !v),
      openNewOrder: () => {
        if (canWrite) setNewOrderOpen(true)
      },
    }),
    [canWrite],
  )

  return (
    <PaletteContext.Provider value={value}>
      {children}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onNewOrder={() => value.openNewOrder()}
      />
      <NewOrderDialog open={newOrderOpen} onOpenChange={setNewOrderOpen} />
    </PaletteContext.Provider>
  )
}

export function useCommandPalette() {
  const ctx = useContext(PaletteContext)
  if (!ctx) {
    throw new Error(
      'useCommandPalette deve ser usado dentro de <CommandPaletteProvider>',
    )
  }
  return ctx
}
