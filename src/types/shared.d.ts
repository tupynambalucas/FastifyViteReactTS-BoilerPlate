import type { ComponentType } from 'react'
// Import Fastify types to correctly type the hooks
import type {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
  onRequestHookHandler,
  preParsingHookHandler,
  preValidationHookHandler,
  preHandlerHookHandler,
  preSerializationHookHandler,
  onErrorHookHandler,
  onSendHookHandler,
  onResponseHookHandler,
  onTimeoutHookHandler,
  onRequestAbortHookHandler,
} from 'fastify'

// -- Shared Utility Types --

export interface MetaInfo {
  title?: string
  meta?: Array<{ name?: string; property?: string; content?: string }>
  link?: Array<{ rel: string; href:string }>
}

export interface SharedRouteContext {
  layout: 'default' | string
  data?: Record<string, unknown>
  head?: MetaInfo
  error?: unknown
  firstRender?: boolean
  request?: FastifyRequest
  reply?: FastifyReply
  fastify?: FastifyInstance
}

// -- The Corrected Route Definition --

export interface SharedRouteDefinition {
  id: string
  path: string
  name: string
  layout: 'default' | string
  component: () => Promise<{ default: ComponentType<any> }>

  // --- ADDED: Custom properties from your server logic ---
  streaming?: boolean
  clientOnly?: boolean
  serverOnly?: boolean
  configure?: (scope: FastifyInstance) => void

  // Data and meta functions
  getMeta?: (ctx: SharedRouteContext) => MetaInfo | Promise<MetaInfo>
  getData?: (ctx: SharedRouteContext) => Record<string, unknown> | Promise<Record<string, unknown>>
  onEnter?: (ctx: SharedRouteContext) => Record<string, unknown> | Promise<Record<string, unknown>>

  // --- ADDED: Fastify hook properties ---
  onRequest?: onRequestHookHandler
  preParsing?: preParsingHookHandler
  preValidation?: preValidationHookHandler
  preHandler?: preHandlerHookHandler
  preSerialization?: preSerializationHookHandler<any>
  onError?: onErrorHookHandler
  onSend?: onSendHookHandler<any>
    onResponse?: onResponseHookHandler
  onTimeout?: onTimeoutHookHandler
  onRequestAbort?: onRequestAbortHookHandler
}