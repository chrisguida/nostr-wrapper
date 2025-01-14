import { sdk } from './sdk'
import { T } from '@start9labs/start-sdk'
import { relayInterfacePort } from './utils'

export const main = sdk.setupMain(async ({ effects, started }) => {
  /**
   * ======================== Setup ========================
   */
  console.info('Starting nostr-rs-relay!')

  /**
   * ======================== Additional Health Checks ========================
   */
  const healthReceipts: T.HealthReceipt[] = []

  /**
   * ======================== Daemons ========================
   */
  return sdk.Daemons.of(effects, started, healthReceipts).addDaemon('primary', {
    subcontainer: { id: 'nostr-rs-relay' },
    command: ['./nostr-rs-relay', '--db', '/data'],
    mounts: sdk.Mounts.of().addVolume('main', null, '/data', false),
    ready: {
      display: 'Relay Listening',
      fn: () =>
        sdk.healthCheck.checkPortListening(effects, relayInterfacePort, {
          successMessage: 'The relay is ready',
          errorMessage: 'The relay is not reachable',
        }),
    },
    requires: [],
  })
})
