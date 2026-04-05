"use client"

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { tickPlayStartAndShouldShowInterstitial } from "@/lib/play-start-ad-gate"
import { tryShowVkInterstitialAd } from "@/lib/vk-bridge"

type Ctx = { runGateBeforeBetSelect: () => Promise<void> }

const PlayEntryAdContext = createContext<Ctx | null>(null)

export function usePlayEntryAdGate(): Ctx {
  const v = useContext(PlayEntryAdContext)
  if (!v) {
    throw new Error("usePlayEntryAdGate must be used within PlayEntryAdProvider")
  }
  return v
}

/** Реклама перед экраном выбора ставки (каждый N-й раз): ВК interstitial или веб-модалка. */
export function PlayEntryAdProvider({ children }: { children: ReactNode }) {
  const [webAdUrl, setWebAdUrl] = useState<string | null>(null)
  const webAdResolveRef = useRef<(() => void) | null>(null)

  const closeWebAdModal = useCallback(() => {
    setWebAdUrl(null)
    const done = webAdResolveRef.current
    webAdResolveRef.current = null
    done?.()
  }, [])

  const runGateBeforeBetSelect = useCallback(async () => {
    if (!tickPlayStartAndShouldShowInterstitial()) return
    const vkShown = await tryShowVkInterstitialAd()
    if (vkShown) return
    const url = process.env.NEXT_PUBLIC_PLAY_AD_WEB_URL?.trim()
    if (!url) return
    await new Promise<void>((resolve) => {
      webAdResolveRef.current = resolve
      setWebAdUrl(url)
    })
  }, [])

  return (
    <PlayEntryAdContext.Provider value={{ runGateBeforeBetSelect }}>
      {children}
      <Dialog
        open={webAdUrl != null}
        onOpenChange={(open) => {
          if (!open) closeWebAdModal()
        }}
      >
        <DialogContent className="sm:max-w-lg" showCloseButton>
          <DialogHeader>
            <DialogTitle>Реклама</DialogTitle>
            <DialogDescription>
              Короткая пауза перед игрой. Нажмите «Продолжить», когда будете готовы.
            </DialogDescription>
          </DialogHeader>
          {webAdUrl ? (
            <div className="w-full overflow-hidden rounded-xl border border-border/60 bg-muted/20 aspect-video">
              <iframe
                title="Реклама"
                src={webAdUrl}
                className="h-full w-full border-0"
                sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              />
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={closeWebAdModal}
              className="w-full rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-600 sm:w-auto"
            >
              Продолжить
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PlayEntryAdContext.Provider>
  )
}
