import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server'
import type { SessionConfig } from './session.js'
import { newCredentialId, type AuthStore, type ChallengeKind } from './store.js'

const CHALLENGE_TTL_MS = 5 * 60 * 1000

function readChallengeFromClientData(clientDataJSON: string): string {
  const clientData = JSON.parse(
    Buffer.from(clientDataJSON, 'base64url').toString('utf8'),
  ) as { challenge?: string }
  if (!clientData.challenge) throw new Error('Missing WebAuthn challenge')
  return clientData.challenge
}

export function createWebAuthnService(config: SessionConfig, store: AuthStore) {
  async function registrationOptions(deviceName?: string) {
    const existing = await store.listCredentials()
    const options = await generateRegistrationOptions({
      rpName: config.rpName,
      rpID: config.rpId,
      userName: config.user.email,
      userDisplayName: config.user.email,
      userID: Buffer.from(config.user.sub),
      attestationType: 'none',
      excludeCredentials: existing.map((credential) => ({
        id: credential.credentialId,
        transports: ['internal', 'hybrid', 'usb', 'ble', 'nfc'] as AuthenticatorTransportFuture[],
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    })
    await store.putChallenge('registration', options.challenge, CHALLENGE_TTL_MS)
    return { options, deviceName: deviceName?.trim() || null }
  }

  async function verifyRegistration(response: RegistrationResponseJSON, deviceName?: string | null) {
    const challenge = readChallengeFromClientData(response.response.clientDataJSON)
    const expectedChallenge = await store.takeChallenge(challenge, 'registration')
    if (!expectedChallenge) throw new Error('Registration challenge expired')

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: config.origins,
      expectedRPID: config.rpId,
      requireUserVerification: false,
    })

    if (!verification.verified || !verification.registrationInfo) {
      throw new Error('Passkey registration failed')
    }

    const { credential, credentialDeviceType } = verification.registrationInfo
    await store.insertCredential({
      id: newCredentialId(),
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: credential.counter,
      deviceName: deviceName ?? credentialDeviceType ?? 'Passkey',
    })

    return { verified: true as const }
  }

  async function authenticationOptions() {
    const credentials = await store.listCredentials()
    if (credentials.length === 0) throw new Error('No passkeys registered')

    const options = await generateAuthenticationOptions({
      rpID: config.rpId,
      allowCredentials: credentials.map((credential) => ({
        id: credential.credentialId,
        transports: ['internal', 'hybrid', 'usb', 'ble', 'nfc'] as AuthenticatorTransportFuture[],
      })),
      userVerification: 'preferred',
    })
    await store.putChallenge('authentication', options.challenge, CHALLENGE_TTL_MS)
    return options
  }

  async function verifyAuthentication(response: AuthenticationResponseJSON) {
    const challenge = readChallengeFromClientData(response.response.clientDataJSON)
    const expectedChallenge = await store.takeChallenge(challenge, 'authentication')
    if (!expectedChallenge) throw new Error('Authentication challenge expired')

    const credential = await store.findByCredentialId(response.id)
    if (!credential) throw new Error('Unknown passkey')

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: config.origins,
      expectedRPID: config.rpId,
      credential: {
        id: credential.credentialId,
        publicKey: new Uint8Array(credential.publicKey),
        counter: credential.counter,
        transports: ['internal', 'hybrid', 'usb', 'ble', 'nfc'],
      },
      requireUserVerification: false,
    })

    if (!verification.verified) throw new Error('Passkey verification failed')

    await store.updateCounter(credential.credentialId, verification.authenticationInfo.newCounter)
    return { verified: true as const }
  }

  return {
    registrationOptions,
    verifyRegistration,
    authenticationOptions,
    verifyAuthentication,
    hasPasskeys: async () => (await store.countCredentials()) > 0,
    listPasskeys: async () =>
      (await store.listCredentials()).map((credential) => ({
        id: credential.id,
        deviceName: credential.deviceName,
        createdAt: credential.createdAt,
      })),
  }
}

export type WebAuthnService = ReturnType<typeof createWebAuthnService>
export type { ChallengeKind }
