import { createMemoryRouter } from "react-router"

type TestRouter = ReturnType<typeof createMemoryRouter>

export function waitForRouterInitialization(router: TestRouter) {
  if (router.state.initialized) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve) => {
    const unsubscribe = router.subscribe((state) => {
      if (!state.initialized) {
        return
      }

      unsubscribe()
      resolve()
    })

    if (router.state.initialized) {
      unsubscribe()
      resolve()
    }
  })
}

export function waitForRouterLocation(router: TestRouter, pathname: string) {
  if (router.state.location.pathname === pathname) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve) => {
    const unsubscribe = router.subscribe((state) => {
      if (state.location.pathname !== pathname) {
        return
      }

      unsubscribe()
      resolve()
    })

    if (router.state.location.pathname === pathname) {
      unsubscribe()
      resolve()
    }
  })
}
