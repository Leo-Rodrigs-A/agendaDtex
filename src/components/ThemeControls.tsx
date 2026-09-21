import { Moon, RotateCcw, Sun } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { PRIMARY_COLORS, useTheme } from '@/components/ThemeProvider'

export function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme()
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      title={
        theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'
      }
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  )
}

export function ColorSwatches() {
  const { primaryColor, setPrimaryColor } = useTheme()
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-6 gap-2">
        {PRIMARY_COLORS.map((color) => (
          <button
            key={color.id}
            type="button"
            title={color.label}
            onClick={() => setPrimaryColor(color.id)}
            className={cn(
              'h-7 w-7 rounded-full transition-all',
              primaryColor === color.id
                ? 'ring-2 ring-ring ring-offset-2 ring-offset-popover scale-110'
                : 'hover:scale-110',
            )}
            style={{ backgroundColor: color.swatch }}
          />
        ))}
      </div>
      {primaryColor && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full gap-2"
          onClick={() => setPrimaryColor(null)}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Cor padrão
        </Button>
      )}
    </div>
  )
}

/** Botão que abre um popover para escolher a cor primária. */
export function ColorPickerButton() {
  const { primaryColor } = useTheme()
  const swatch = primaryColor
    ? PRIMARY_COLORS.find((c) => c.id === primaryColor)?.swatch
    : null
  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant="outline" size="icon" title="Cor primária" />}
      >
        <span
          className="h-4 w-4 rounded-full"
          style={{ backgroundColor: swatch ?? 'var(--primary)' }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <ColorSwatches />
      </PopoverContent>
    </Popover>
  )
}
