import { configToml } from '../../file-models/config.toml'
import { sdk } from '../../sdk'

const { InputSpec, Value, Variants } = sdk

// input spec
const inputSpec = InputSpec.of({
  pay_to_relay: Value.union(
    {
      name: 'Pay to Relay',
      default: 'disabled',
    },
    Variants.of({
      disabled: {
        name: 'Disabled',
        spec: InputSpec.of({}),
      },
      enabled: {
        name: 'Enabled',
        spec: InputSpec.of({
          sign_ups: Value.toggle({
            name: 'Sign Ups',
            description: 'Whether or not new sign ups should be allowed',
            default: true,
          }),
          processor: Value.union(
            {
              name: 'Processor',
              default: 'ClnRest',
            },
            Variants.of({
              ClnRest: {
                name: 'ClnRest',
                spec: InputSpec.of({}),
              },
              LNBits: {
                name: 'LNBits',
                spec: InputSpec.of({
                  api_secret: Value.text({
                    name: 'API Secret',
                    description: 'Your LNBits API secret',
                    required: true,
                    default: null,
                    masked: true,
                  }),
                }),
              },
            }),
          ),
          admission_cost: Value.number({
            name: 'Admission Cost',
            description: 'The cost to be admitted to the relay',
            required: false,
            default: null,
            integer: true,
            units: 'Sats',
            min: 1,
          }),
          cost_per_event: Value.number({
            name: 'Cost Per Event',
            description: 'The cost per post',
            required: false,
            default: null,
            integer: true,
            units: 'Sats',
            min: 1,
          }),
          direct_message: Value.union(
            {
              name: 'Direct Message on Signup',
              description: 'Optionally send a direct message to new customers',
              default: 'disabled',
            },
            Variants.of({
              disabled: {
                name: 'Disabled',
                spec: InputSpec.of({}),
              },
              enabled: {
                name: 'Enabled',
                spec: InputSpec.of({
                  terms_message: Value.textarea({
                    name: 'Terms of Service',
                    description:
                      'The message to send to new customers on signup',
                    required: true,
                    default: `
This service (and supporting services) are provided "as is", without warranty of any kind, express or implied.

By using this service, you agree:
* Not to engage in spam or abuse the relay service
* Not to disseminate illegal content
* That requests to delete content cannot be guaranteed
* To use the service in compliance with all applicable laws
* To grant necessary rights to your content for unlimited time
* To be of legal age and have capacity to use this service
* That the service may be terminated at any time without notice
* That the content you publish may be removed at any time without notice
* To have your IP address collected to detect abuse or misuse
* To cooperate with the relay to combat abuse or misuse
* You may be exposed to content that you might find triggering or distasteful
* The relay operator is not liable for content produced by users of the relay,
`,
                  }),
                  secret_key: Value.text({
                    name: 'Secret Key (nsec)',
                    description:
                      'The Nostr private key (nsec) from which to send the direct message',
                    required: true,
                    default: null,
                  }),
                }),
              },
            }),
          ),
        }),
      },
    }),
  ),
})

export const configurePayments = sdk.Action.withInput(
  // id
  'configure-payments',

  // metadata
  async ({ effects }) => ({
    name: 'Payments',
    description: 'Require payment to use this relay',
    warning: null,
    allowedStatuses: 'any',
    group: 'configure',
    visibility: 'enabled',
  }),

  // form input specification
  inputSpec,

  // optionally pre-fill the input form
  async function ({ effects }) {
    const pay_to_relay = (await configToml.read.const(effects))?.pay_to_relay
    if (!pay_to_relay) return

    return {
      pay_to_relay: pay_to_relay.enabled
        ? {
            selection: 'enabled' as const,
            value: {
              ...pay_to_relay,
              processor:
                pay_to_relay.processor === 'LNBits'
                  ? {
                      selection: 'LNBits' as const,
                      value: {
                        api_secret: pay_to_relay.api_secret,
                      },
                    }
                  : {
                      selection: 'ClnRest' as const,
                      value: {},
                    },
              direct_message: pay_to_relay.direct_message
                ? {
                    selection: 'enabled' as const,
                    value: {
                      terms_message: pay_to_relay.terms_message,
                      secret_key: pay_to_relay.secret_key,
                    },
                  }
                : {
                    selection: 'disabled' as const,
                    value: {},
                  },
            },
          }
        : {
            selection: 'disabled' as const,
            value: {},
          },
    }
  },

  // the execution function
  async ({ effects, input }) => {},
)
