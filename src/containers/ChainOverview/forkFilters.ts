import { slug } from '~/utils'
import type { IChildProtocol, IProtocol } from './types'

export const ALL_PROTOCOLS_FORK_FILTER = 'All protocols'
export const FORKED_PROTOCOLS_FILTER = 'Forked protocols'

const getProtocolForks = (protocol: IProtocol): string[] => {
	const forks = new Set<string>()
	for (const fork of protocol.forkedFrom ?? []) {
		forks.add(fork)
	}
	for (const child of protocol.childProtocols ?? []) {
		for (const fork of child.forkedFrom ?? []) {
			forks.add(fork)
		}
	}
	return Array.from(forks)
}

export const getForkFilterOptions = (protocols: IProtocol[]): string[] => {
	const forks = new Set<string>()
	for (const protocol of protocols) {
		for (const fork of getProtocolForks(protocol)) {
			forks.add(fork)
		}
	}
	return [ALL_PROTOCOLS_FORK_FILTER, FORKED_PROTOCOLS_FILTER, ...Array.from(forks).sort((a, b) => a.localeCompare(b))]
}

export const getValidForkFilter = (rawFilter: string | null | undefined, options: string[]): string => {
	if (!rawFilter) return ALL_PROTOCOLS_FORK_FILTER

	const normalizedFilter = slug(rawFilter)
	return options.find((option) => slug(option) === normalizedFilter) ?? ALL_PROTOCOLS_FORK_FILTER
}

export const filterProtocolsByFork = (protocols: IProtocol[], forkFilter: string): IProtocol[] => {
	if (forkFilter === ALL_PROTOCOLS_FORK_FILTER) return protocols

	const filtered: IProtocol[] = []
	const isForkedProtocolsFilter = forkFilter === FORKED_PROTOCOLS_FILTER
	const normalizedForkFilter = slug(forkFilter)

	const matchesForkFilter = (protocol: IChildProtocol) => {
		const forkedFrom = protocol.forkedFrom ?? []
		if (isForkedProtocolsFilter) return forkedFrom.length > 0
		return forkedFrom.some((fork) => slug(fork) === normalizedForkFilter)
	}

	for (const protocol of protocols) {
		if (protocol.childProtocols?.length) {
			const matchingChildren = protocol.childProtocols.filter(matchesForkFilter)
			if (matchingChildren.length > 0) {
				filtered.push(...matchingChildren)
			}
			continue
		}

		if (matchesForkFilter(protocol)) {
			filtered.push(protocol)
		}
	}

	return filtered
}
