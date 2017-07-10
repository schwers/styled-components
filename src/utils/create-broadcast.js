// @flow
/**
 * Creates a broadcast that can be listened to, i.e. simple event emitter
 *
 * @see https://github.com/ReactTraining/react-broadcast
 */

export type Broadcast = {
  publish: (value: mixed) => void,
  subscribe: (listener: (currentValue: mixed) => void) => () => void
}

const createBroadcast = (initialValue: mixed): Broadcast => {
  const listeners = {}
  let id = 0
  let currentValue = initialValue

  return {
    publish(value: mixed) {
      currentValue = value
      Object.keys(listeners).forEach(key => listeners[key](currentValue))
    },
    subscribe(listener) {
      const subscriptionId = id
      id += 1
      listeners[subscriptionId] = listener

      // Publish to this subscriber once immediately.
      listener(currentValue)

      return () => {
        delete listeners[subscriptionId]
      }
    },
  }
}

export default createBroadcast
