import { describe, expect, it } from 'vitest'
import {
	ALL_PROTOCOLS_FORK_FILTER,
	FORKED_PROTOCOLS_FILTER,
	filterProtocolsByFork,
	getForkFilterOptions,
	getValidForkFilter
} from '../forkFilters'
import type { IProtocol } from '../types'

const makeProtocol = (overrides: Partial<IProtocol>): IProtocol =>
	({
		name: 'Protocol',
		slug: 'protocol',
		category: 'Dexs',
		tvl: null,
		tvlChange: null,
		chains: ['Ethereum'],
		mcap: null,
		tokenPrice: null,
		mcaptvl: null,
		strikeTvl: false,
		...overrides
	}) as IProtocol

describe('chain overview fork filters', () => {
	it('builds filter options from top-level and child protocol ancestry', () => {
		const protocols = [
			makeProtocol({ name: 'Aave Fork', forkedFrom: ['Aave'] }),
			makeProtocol({
				name: 'DEX Parent',
				childProtocols: [
					makeProtocol({ name: 'Uni Fork', forkedFrom: ['Uniswap'] }),
					makeProtocol({ name: 'Curve Fork', forkedFrom: ['Curve'] })
				]
			})
		]

		expect(getForkFilterOptions(protocols)).toEqual([
			ALL_PROTOCOLS_FORK_FILTER,
			FORKED_PROTOCOLS_FILTER,
			'Aave',
			'Curve',
			'Uniswap'
		])
	})

	it('normalizes URL filter values against the available options', () => {
		const options = [ALL_PROTOCOLS_FORK_FILTER, FORKED_PROTOCOLS_FILTER, 'Uniswap V2']

		expect(getValidForkFilter('uniswap-v2', options)).toBe('Uniswap V2')
		expect(getValidForkFilter('missing-fork', options)).toBe(ALL_PROTOCOLS_FORK_FILTER)
		expect(getValidForkFilter(undefined, options)).toBe(ALL_PROTOCOLS_FORK_FILTER)
	})

	it('filters grouped rows down to matching child protocols for a specific fork', () => {
		const protocols = [
			makeProtocol({
				name: 'DEX Parent',
				childProtocols: [
					makeProtocol({ name: 'Uni Fork', forkedFrom: ['Uniswap'] }),
					makeProtocol({ name: 'Curve Fork', forkedFrom: ['Curve'] })
				]
			}),
			makeProtocol({ name: 'Native Protocol' })
		]

		expect(filterProtocolsByFork(protocols, 'Uniswap').map((protocol) => protocol.name)).toEqual(['Uni Fork'])
	})

	it('returns every forked protocol when the forked protocols filter is selected', () => {
		const protocols = [
			makeProtocol({ name: 'Aave Fork', forkedFrom: ['Aave'] }),
			makeProtocol({
				name: 'DEX Parent',
				childProtocols: [
					makeProtocol({ name: 'Uni Fork', forkedFrom: ['Uniswap'] }),
					makeProtocol({ name: 'Native Child' })
				]
			}),
			makeProtocol({ name: 'Native Protocol' })
		]

		expect(filterProtocolsByFork(protocols, FORKED_PROTOCOLS_FILTER).map((protocol) => protocol.name)).toEqual([
			'Aave Fork',
			'Uni Fork'
		])
	})
})
