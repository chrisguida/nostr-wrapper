import { sdk } from './sdk'
import { relayInterfacePort, relayInterfaceId } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const apiMulti = sdk.MultiHost.of(effects, 'ui-multi')
  const apiMultiOrigin = await apiMulti.bindPort(relayInterfacePort, {
    protocol: 'ws',
  })
  const api = sdk.createInterface(effects, {
    name: 'Relay Websocket',
    id: relayInterfaceId,
    description: 'Nostr clients use this interface to connect to the relay',
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    search: {},
  })

  const apiReceipt = await apiMultiOrigin.export([api])

  return [apiReceipt]
})
