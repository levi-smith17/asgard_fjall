import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'node:crypto'

export type PasskeyCredential = {
  id: string
  credentialId: string
  publicKey: Buffer
  counter: number
  deviceName: string | null
  createdAt: string
}

export type ChallengeKind = 'registration' | 'authentication'

export type AuthStore = {
  countCredentials(): Promise<number>
  listCredentials(): Promise<PasskeyCredential[]>
  findByCredentialId(credentialId: string): Promise<PasskeyCredential | null>
  insertCredential(input: {
    id: string
    credentialId: string
    publicKey: Buffer
    counter: number
    deviceName?: string | null
  }): Promise<void>
  deleteCredentialById(id: string): Promise<boolean>
  updateCounter(credentialId: string, counter: number): Promise<void>
  putChallenge(kind: ChallengeKind, challenge: string, ttlMs: number): Promise<void>
  takeChallenge(challenge: string, kind: ChallengeKind): Promise<string | null>
}

type MemoryState = {
  credentials: PasskeyCredential[]
  challenges: Map<string, { kind: ChallengeKind; exp: number }>
}

export function createMemoryStore(): AuthStore {
  const state: MemoryState = { credentials: [], challenges: new Map() }

  return {
    async countCredentials() {
      return state.credentials.length
    },
    async listCredentials() {
      return [...state.credentials]
    },
    async findByCredentialId(credentialId) {
      return state.credentials.find((item) => item.credentialId === credentialId) ?? null
    },
    async insertCredential(input) {
      state.credentials.push({
        id: input.id,
        credentialId: input.credentialId,
        publicKey: input.publicKey,
        counter: input.counter,
        deviceName: input.deviceName ?? null,
        createdAt: new Date().toISOString(),
      })
    },
    async deleteCredentialById(id) {
      const before = state.credentials.length
      state.credentials = state.credentials.filter((entry) => entry.id !== id)
      return state.credentials.length < before
    },
    async updateCounter(credentialId, counter) {
      const item = state.credentials.find((entry) => entry.credentialId === credentialId)
      if (item) item.counter = counter
    },
    async putChallenge(kind, challenge, ttlMs) {
      state.challenges.set(challenge, { kind, exp: Date.now() + ttlMs })
    },
    async takeChallenge(challenge, kind) {
      const entry = state.challenges.get(challenge)
      state.challenges.delete(challenge)
      if (!entry || entry.kind !== kind || entry.exp <= Date.now()) return null
      return challenge
    },
  }
}

export function createDynamoStore(tableName: string): AuthStore {
  const client = DynamoDBDocumentClient.from(new DynamoDBClient({}))

  return {
    async countCredentials() {
      const result = await client.send(
        new ScanCommand({
          TableName: tableName,
          FilterExpression: 'begins_with(pk, :pk)',
          ExpressionAttributeValues: { ':pk': 'PASSKEY#' },
          Select: 'COUNT',
        }),
      )
      return result.Count ?? 0
    },

    async listCredentials() {
      const result = await client.send(
        new ScanCommand({
          TableName: tableName,
          FilterExpression: 'begins_with(pk, :pk)',
          ExpressionAttributeValues: { ':pk': 'PASSKEY#' },
        }),
      )
      return (result.Items ?? []).map((item) => ({
        id: String(item.id),
        credentialId: String(item.credentialId),
        publicKey: Buffer.from(item.publicKey as string, 'base64'),
        counter: Number(item.counter ?? 0),
        deviceName: (item.deviceName as string | null) ?? null,
        createdAt: String(item.createdAt),
      }))
    },

    async findByCredentialId(credentialId) {
      const result = await client.send(
        new GetCommand({
          TableName: tableName,
          Key: { pk: `PASSKEY#${credentialId}`, sk: 'CREDENTIAL' },
        }),
      )
      const item = result.Item
      if (!item) return null
      return {
        id: String(item.id),
        credentialId: String(item.credentialId),
        publicKey: Buffer.from(item.publicKey as string, 'base64'),
        counter: Number(item.counter ?? 0),
        deviceName: (item.deviceName as string | null) ?? null,
        createdAt: String(item.createdAt),
      }
    },

    async insertCredential(input) {
      const createdAt = new Date().toISOString()
      await client.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            pk: `PASSKEY#${input.credentialId}`,
            sk: 'CREDENTIAL',
            id: input.id,
            credentialId: input.credentialId,
            publicKey: input.publicKey.toString('base64'),
            counter: input.counter,
            deviceName: input.deviceName ?? null,
            createdAt,
          },
        }),
      )
    },

    async deleteCredentialById(id) {
      const result = await client.send(
        new ScanCommand({
          TableName: tableName,
          FilterExpression: 'begins_with(pk, :pk) AND id = :id',
          ExpressionAttributeValues: { ':pk': 'PASSKEY#', ':id': id },
        }),
      )
      const item = result.Items?.[0]
      if (!item?.credentialId) return false
      await client.send(
        new DeleteCommand({
          TableName: tableName,
          Key: { pk: `PASSKEY#${String(item.credentialId)}`, sk: 'CREDENTIAL' },
        }),
      )
      return true
    },

    async updateCounter(credentialId, counter) {
      await client.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { pk: `PASSKEY#${credentialId}`, sk: 'CREDENTIAL' },
          UpdateExpression: 'SET #c = :c',
          ExpressionAttributeNames: { '#c': 'counter' },
          ExpressionAttributeValues: { ':c': counter },
        }),
      )
    },

    async putChallenge(kind, challenge, ttlMs) {
      const ttl = Math.floor((Date.now() + ttlMs) / 1000)
      await client.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            pk: `CHALLENGE#${challenge}`,
            sk: `KIND#${kind}`,
            challenge,
            kind,
            ttl,
          },
        }),
      )
    },

    async takeChallenge(challenge, kind) {
      const key = { pk: `CHALLENGE#${challenge}`, sk: `KIND#${kind}` }
      const result = await client.send(new GetCommand({ TableName: tableName, Key: key }))
      if (!result.Item) return null
      await client.send(new DeleteCommand({ TableName: tableName, Key: key }))
      const ttl = Number(result.Item.ttl ?? 0)
      if (ttl * 1000 <= Date.now()) return null
      return challenge
    },
  }
}

export function createStoreFromEnv(env: NodeJS.ProcessEnv = process.env): AuthStore {
  const table = env.FJALL_AUTH_TABLE?.trim()
  if (table) return createDynamoStore(table)
  return createMemoryStore()
}

export function newCredentialId() {
  return randomUUID()
}
