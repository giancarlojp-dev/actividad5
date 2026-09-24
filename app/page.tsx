'use client'

import { ChangeEvent, useEffect, useRef, useState } from 'react'
import {
  ArrowUp,
  Check,
  FileText,
  Leaf,
  Loader2,
  Magnet,
  Package,
  Recycle,
  ScanLine,
  Sparkles,
  Upload,
  Wine,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress, ProgressIndicator, ProgressTrack } from '@/components/ui/progress'

declare global {
  interface Window {
    tmImage: any
  }
}

const MODEL_URL = '/actividad5/model/model.json'
const METADATA_URL = '/actividad5/model/metadata.json'
const BAR_COLORS = ['bg-[#d8bd7a]', 'bg-[#7290c6]', 'bg-[#91b7a3]', 'bg-[#a9896b]']

function iconFor(label: string) {
  const key = label.toLowerCase()
  if (key.includes('papel')) return FileText
  if (key.includes('cart')) return Package
  if (key.includes('vidrio') || key.includes('glass')) return Wine
  if (key.includes('metal')) return Magnet
  if (key.includes('org')) return Leaf
  return Recycle
}

type Prediction = { className: string; probability: number }

export default function Page() {
  const inputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const modelRef = useRef<any>(null)

  const [preview, setPreview] = useState<string | null>(null)
  const [labels, setLabels] = useState<string[]>([])
  const [results, setResults] = useState<Prediction[]>([])
  const [modelReady, setModelReady] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      while (!window.tmImage) {
        await new Promise((r) => setTimeout(r, 150))
      }
      const [model, metadataRes] = await Promise.all([
        window.tmImage.load(MODEL_URL, METADATA_URL),
        fetch(METADATA_URL).then((r) => r.json()),
      ])
      if (cancelled) return
      modelRef.current = model
      setLabels(metadataRes.labels ?? [])
      setModelReady(true)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) {
      setPreview(URL.createObjectURL(file))
      setAnalyzed(false)
      setResults([])
    }
  }

  function handleDrop(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file?.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file))
      setAnalyzed(false)
      setResults([])
    }
  }

  async function handleAnalyze() {
    if (!modelRef.current || !imgRef.current) return
    setAnalyzing(true)
    const predictions: Prediction[] = await modelRef.current.predict(imgRef.current)
    predictions.sort((a, b) => b.probability - a.probability)
    setResults(predictions)
    setAnalyzing(false)
    setAnalyzed(true)
  }

  const top = results[0]

  return (
    <main className="min-h-screen bg-[#010736] px-5 py-7 text-[#FCF1D0] sm:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-6xl flex-col">
        <header className="mb-8 flex items-start justify-between gap-5 border-b border-[#22396F]/80 pb-6">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#22396F] shadow-lg shadow-black/20">
                <ScanLine className="size-5" aria-hidden="true" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9ba9cf]">Laboratorio IA · 01</span>
            </div>
            <h1 className="font-sans text-3xl font-semibold tracking-tight sm:text-4xl">EcoScan</h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[#b6c0da]">Sube una foto y detecta si el residuo es reciclable.</p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[#22396F] px-3 py-2 text-xs text-[#b6c0da] sm:flex">
            <span className={`size-2 rounded-full ${modelReady ? 'bg-[#91b7a3]' : 'bg-[#8291ba]'}`} aria-hidden="true" />
            {modelReady ? 'Modelo listo' : 'Cargando modelo…'}
          </div>
        </header>

        <section aria-label="Categorías reconocidas" className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {labels.map((name, index) => {
            const Icon = iconFor(name)
            return (
              <Badge key={name} variant="outline" className="h-auto justify-start gap-3 rounded-xl border-[#22396F] bg-[#0D1C42] px-4 py-3 text-[#FCF1D0] shadow-lg shadow-black/10">
                <span className="flex size-7 items-center justify-center rounded-lg bg-[#22396F] text-[#d8bd7a]"><Icon className="size-4" aria-hidden="true" /></span>
                <span className="text-xs font-medium tracking-wide">0{index + 1} · {name}</span>
              </Badge>
            )
          })}
        </section>

        <div className="grid flex-1 gap-5 lg:grid-cols-[1.12fr_0.88fr]">
          <Card className="border-[#22396F] bg-[#0D1C42] text-[#FCF1D0] shadow-2xl shadow-black/20">
            <CardHeader className="gap-1 border-b border-[#22396F]/70 px-6 pb-5 pt-6 sm:px-8">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium tracking-wide">Muestra de residuo</CardTitle>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8291ba]">Input / image</span>
              </div>
              <p className="text-xs text-[#9ba9cf]">El modelo analiza la composición visual de tu muestra.</p>
            </CardHeader>
            <CardContent className="px-6 pb-7 pt-6 sm:px-8">
              <button type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} className="group relative flex min-h-[280px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#687cae] bg-[#010736]/45 p-6 text-center transition-colors hover:border-[#FCF1D0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FCF1D0]">
                {preview ? (
                  <>
                    <img ref={imgRef} src={preview} alt="Vista previa del residuo cargado" className="absolute inset-0 size-full object-contain p-3" />
                    <span className="absolute bottom-4 rounded-full bg-[#010736]/85 px-4 py-2 text-xs text-[#FCF1D0]">Haz clic para cambiar imagen</span>
                  </>
                ) : (
                  <>
                    <span className="mb-5 flex size-16 items-center justify-center rounded-2xl border border-[#22396F] bg-[#22396F]/50 text-[#d8bd7a] transition-transform group-hover:-translate-y-1"><Upload className="size-7" strokeWidth={1.5} aria-hidden="true" /></span>
                    <span className="text-sm font-medium">Arrastra tu imagen aquí o haz clic para subir</span>
                    <span className="mt-2 text-xs text-[#8291ba]">JPG, PNG o WEBP · máximo 10 MB</span>
                  </>
                )}
              </button>
              <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="sr-only" aria-label="Seleccionar imagen de residuo" />
              <Button type="button" onClick={handleAnalyze} disabled={!preview || !modelReady || analyzing} className="mt-5 h-12 w-full rounded-xl bg-[#22396F] text-[#FCF1D0] shadow-lg shadow-[#010736]/40 hover:bg-[#2c4a8e] disabled:cursor-not-allowed disabled:opacity-50">
                {analyzing ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Sparkles data-icon="inline-start" />}
                {analyzing ? 'Analizando…' : 'Analizar imagen'}
                {!analyzing && <ArrowUp data-icon="inline-end" />}
              </Button>
              <p className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] text-[#8291ba]">
                <Check className="size-3.5 text-[#91b7a3]" aria-hidden="true" /> Modelo Teachable Machine conectado
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#22396F] bg-[#0D1C42] text-[#FCF1D0] shadow-2xl shadow-black/20">
            <CardHeader className="gap-1 border-b border-[#22396F]/70 px-6 pb-5 pt-6 sm:px-8">
              <div className="flex items-center justify-between"><CardTitle className="text-base font-medium tracking-wide">Resultado de clasificación</CardTitle><span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8291ba]">Output / data</span></div>
              <p className="text-xs text-[#9ba9cf]">Distribución de confianza por categoría.</p>
            </CardHeader>
            <CardContent className="px-6 pb-7 pt-6 sm:px-8">
              <div className="mb-7 flex items-center gap-4 rounded-2xl border border-[#22396F] bg-[#010736]/50 p-4">
                <div className="flex size-14 items-center justify-center rounded-xl bg-[#22396F] text-[#d8bd7a]">
                  {top ? <IconIndicator label={top.className} /> : <ScanLine className="size-7" strokeWidth={1.5} aria-hidden="true" />}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#8291ba]">Categoría detectada</p>
                  <p className="mt-1 text-2xl font-semibold">{top ? top.className : '—'}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="font-mono text-2xl font-semibold text-[#d8bd7a]">{top ? `${Math.round(top.probability * 100)}%` : '—'}</p>
                  <p className="text-[10px] text-[#8291ba]">confianza</p>
                </div>
              </div>
              <div className="flex flex-col gap-5">
                {(results.length ? results : labels.map((name) => ({ className: name, probability: 0 }))).map(({ className: name, probability }, index) => (
                  <div key={name}>
                    <div className="mb-2 flex justify-between text-xs">
                      <span className={top?.className === name ? 'font-semibold' : 'text-[#b6c0da]'}>{name}</span>
                      <span className="font-mono text-[#b6c0da]">{Math.round(probability * 100)}%</span>
                    </div>
                    <Progress value={Math.round(probability * 100)} className="gap-0">
                      <ProgressTrack className="h-2 bg-[#010736]">
                        <ProgressIndicator className={BAR_COLORS[index % BAR_COLORS.length]} />
                      </ProgressTrack>
                    </Progress>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex items-start gap-3 border-t border-[#22396F]/70 pt-5">
                <Recycle className="mt-0.5 size-4 shrink-0 text-[#91b7a3]" aria-hidden="true" />
                <p className="text-xs leading-relaxed text-[#9ba9cf]">
                  {analyzed && top ? `Este residuo corresponde a la categoría "${top.className}".` : 'Sube una imagen y presiona "Analizar imagen" para ver la categoría detectada.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <footer className="mt-6 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-[#66769f]">
          <span>EcoScan / Clasificación experimental</span>
          <span className="hidden sm:inline">Teachable Machine · en vivo</span>
        </footer>
      </div>
    </main>
  )
}

function IconIndicator({ label }: { label: string }) {
  const Icon = iconFor(label)
  return <Icon className="size-7" strokeWidth={1.5} aria-hidden="true" />
}