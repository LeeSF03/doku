"use client"

export type Gammacv = typeof import("gammacv")
export type GammaOutput = NonNullable<ReturnType<Gammacv["tensorFrom"]>>

let gm: Gammacv | null = null
let gmPromise: Promise<Gammacv> | null = null

export function getGammaCv() {
  if (gm) return Promise.resolve(gm)

  gmPromise ??= import("gammacv")
    .then((module) => {
      gm = module

      return gm
    })
    .catch((error) => {
      gmPromise = null
      throw error
    })

  return gmPromise
}
