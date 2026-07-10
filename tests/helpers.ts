import type { HeaderRule, MockRule, Profile } from '../src/core/types'

export function makeHeaderRule(over: Partial<HeaderRule> = {}): HeaderRule {
  return {
    id: 'h1',
    enabled: true,
    target: 'request',
    action: 'set',
    name: 'X-Test',
    value: 'v',
    ...over,
  }
}

export function makeMockRule(over: Partial<MockRule> = {}): MockRule {
  return {
    id: 'm1',
    enabled: true,
    urlPattern: '/api/x',
    method: 'ANY',
    mode: 'page',
    statusCode: 200,
    headers: [],
    body: '{}',
    delayMs: 0,
    ...over,
  }
}

export function makeProfile(over: Partial<Profile> = {}): Profile {
  return {
    id: 'p1',
    name: 'Profile 1',
    enabled: true,
    headerRules: [],
    mockRules: [],
    ...over,
  }
}
