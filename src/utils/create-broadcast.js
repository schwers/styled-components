// @flow
/**
 * Creates a broadcast that can be listened to, i.e. simple event emitter
 *
 * @see https://github.com/ReactTraining/react-broadcast
 */

export type Broadcast = {
  publish: (value: mixed) => void,
  subscribe: (listener: (currentValue: mixed) => void) => number,
  unsubscribe: (number) => void,
  currentState: () => mixed,
  cleanup: () => void,
}

const createBroadcast = (initialState: mixed): Broadcast => {
  let listeners = {}
  let id = 0
  let state = initialState

  function publish(nextState: mixed) {
    state = nextState

    // eslint-disable-next-line guard-for-in, no-restricted-syntax
    for (const key in listeners) {
      const listener = listeners[key]
      if (listener === undefined) {
        // eslint-disable-next-line no-continue
        continue
      }

      listener(state)
    }
  }

  function subscribe(listener) {
    const currentId = id
    listeners[currentId] = listener
    id += 1
    return currentId
  }

  function unsubscribe(unsubID: number) {
    if (listeners !== undefined) {
      listeners[unsubID] = undefined
    }
  }

  function currentState() {
    return state
  }

  function cleanup() {
    const keys = Object.keys(listeners);
    for (let i = 0; i < keys.length; i++) {
      unsubscribe(listeners[i]);
    }

    listeners = undefined
    initialState = undefined
  }

  return {
    publish,
    subscribe,
    unsubscribe,
    currentState,
    cleanup,
  }
}

export default createBroadcast
