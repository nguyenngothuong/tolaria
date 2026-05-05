import type { MobileGitOperation, MobileGitSyncPlan } from './mobileGitSyncPlan'
import type { MobileGitRemote } from './mobileGitRemote'

export type MobileGitTransportOperation = Exclude<MobileGitOperation, 'clone'>

export type MobileGitPrimaryAction =
  | {
      state: 'authenticate'
    }
  | {
      operation: MobileGitTransportOperation
      remote: MobileGitRemote
      state: 'transport'
    }
  | {
      state: 'ignored'
    }

export function mobileGitPrimaryActionForPlan(plan: MobileGitSyncPlan): MobileGitPrimaryAction {
  if (plan.state === 'authRequired') {
    return { state: 'authenticate' }
  }

  if (plan.state === 'ready') {
    return transportAction({
      operation: plan.primaryAction,
      remote: plan.remote,
    })
  }

  if (plan.state === 'failed') {
    return plan.operation === 'clone'
      ? { state: 'authenticate' }
      : transportAction({ operation: plan.operation, remote: plan.remote })
  }

  return { state: 'ignored' }
}

function transportAction({
  operation,
  remote,
}: {
  operation: MobileGitTransportOperation
  remote: MobileGitRemote
}): MobileGitPrimaryAction {
  return {
    operation,
    remote,
    state: 'transport',
  }
}
