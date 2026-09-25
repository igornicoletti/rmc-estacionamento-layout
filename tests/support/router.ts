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
