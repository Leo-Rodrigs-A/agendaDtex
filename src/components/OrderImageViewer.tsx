import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from 'cn'
import { driveImageSrc } from '@/lib/drive'
import type { Order } from '@/types'

const ZOOM_IN = 2.5

/**
 * Visualizador de imagem do pedido em tela cheia:
 * sem moldura, só a imagem (~70vh).
 * Clique fora ou Esc fecha. Clique na imagem alterna o zoom (1x ↔ 2.5x).
 */
export function OrderImageViewer({
  order,
  onClose,
}: {
  order: Order | null
  onClose: () => void
}) {
  const [zoomed, setZoomed] = useState(false)
  const [failed, setFailed] = useState(false)

  // Reseta zoom/erro ao trocar de pedido
  useEffect(() => {
    setZoomed(false)
    setFailed(false)
  }, [order?.id])

  useEffect(() => {
    if (!order) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [order, onClose])

  if (!order?.imgurl?.trim()) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Imagem do pedido ${order.order_name}`}
      className="fixed inset-0 z-100 flex cursor-zoom-out items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      {failed ? (
        <div className="rounded-lg bg-muted px-6 py-8 text-sm text-muted-foreground">
          Não foi possível carregar a imagem. Verifique se o link está público.
        </div>
      ) : (
        <img
          src={driveImageSrc(order.imgurl)}
          alt={`Imagem do pedido ${order.order_name}`}
          title={zoomed ? 'Clique para reduzir' : 'Clique para ampliar'}
          onError={() => setFailed(true)}
          onClick={(e) => {
            e.stopPropagation()
            setZoomed((z) => !z)
          }}
          style={{ transform: zoomed ? `scale(${ZOOM_IN})` : 'scale(1)' }}
          className={cn(
            'max-h-[70vh] object-contain transition-transform duration-150 select-none',
            zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in',
          )}
          draggable={false}
        />
      )}
    </div>,
    document.body,
  )
}
