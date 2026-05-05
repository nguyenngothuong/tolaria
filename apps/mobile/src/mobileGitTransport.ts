import type { MobileGitRemote } from './mobileGitRemote'
import type { MobileVaultMetadata } from './mobileVaultMetadata'
import type { MobileGitTransportOperation } from './mobileGitPrimaryAction'

export type MobileGitTransportRequest = {
  remote: MobileGitRemote
  vault: MobileVaultMetadata
}

export type MobileGitTransportResult =
  | {
      state: 'completed'
    }
  | {
      message: string
      state: 'failed'
    }

export type MobileGitTransport = {
  pull: (request: MobileGitTransportRequest) => Promise<MobileGitTransportResult>
  push: (request: MobileGitTransportRequest) => Promise<MobileGitTransportResult>
}

export function createUnavailableMobileGitTransport(): MobileGitTransport {
  return {
    pull: () => unavailableTransportResult(),
    push: () => unavailableTransportResult(),
  }
}

export function runMobileGitTransportOperation({
  operation,
  remote,
  transport,
  vault,
}: {
  operation: MobileGitTransportOperation
  remote: MobileGitRemote
  transport: MobileGitTransport
  vault: MobileVaultMetadata
}) {
  return transport[operation]({ remote, vault })
}

function unavailableTransportResult(): Promise<MobileGitTransportResult> {
  return Promise.resolve({
    message: 'Mobile Git transport is not available yet.',
    state: 'failed',
  })
}
