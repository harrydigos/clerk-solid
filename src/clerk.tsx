import { Component, batch } from 'solid-js'
import { parsePublishableKey } from '@clerk/shared/keys'
import { createScriptLoader } from './script-loader'
import { ClerkOptions, MultiDomainAndOrProxy, SDKMetadata, Without } from '@clerk/types'
import { setClerk, setCsrStore } from './stores'

export type IsomorphicClerkOptions = Without<ClerkOptions, 'isSatellite'> & {
  // Clerk?: ClerkProp;
  clerkJSUrl?: string
  clerkJSVariant?: 'headless' | ''
  clerkJSVersion?: string
  sdkMetadata?: SDKMetadata
  publishableKey: string
} & MultiDomainAndOrProxy

export type ClerkProviderProps = IsomorphicClerkOptions & {
  // children: React.ReactNode;
  // initialState?: InitialState;
}

type BuildClerkJsScriptOptions = {
  clerkJSUrl?: string
  clerkJSVariant?: 'headless' | ''
  clerkJSVersion?: string
  publishableKey: string
}

const clerkJsScriptUrl = (opts: BuildClerkJsScriptOptions) => {
  const { clerkJSUrl, clerkJSVariant, publishableKey } = opts

  if (clerkJSUrl) {
    return clerkJSUrl
  }

  let scriptHost = ''
  scriptHost = parsePublishableKey(publishableKey)?.frontendApi || ''

  const variant = clerkJSVariant ? `${clerkJSVariant.replace(/\.+$/, '')}.` : ''
  const version = '5'
  return `https://${scriptHost}/npm/@clerk/clerk-js@${version}/dist/clerk.${variant}browser.js`
}

function buildClerkHotloadScript(options: BuildClerkJsScriptOptions) {
  return clerkJsScriptUrl(options)
}

export const Clerk: Component<ClerkProviderProps> = props => {
  createScriptLoader({
    src: buildClerkHotloadScript(props),
    'data-clerk-publishable-key': props.publishableKey,
    async onLoad() {
      const clerkJSInstance = window.Clerk
      await window.Clerk.load()

      setClerk(window.Clerk)

      // TODO: add nano stores solid
      // TODO: Create google one tap for solid
      clerkJSInstance.addListener(payload => {
        batch(() => {
          setCsrStore('isLoaded', true)
          setCsrStore('client', payload.client)
          setCsrStore('user', payload.user)
          setCsrStore('session', payload.session)
          setCsrStore('organization', payload.organization)
        })
      })
    },
  })

  return null
}
