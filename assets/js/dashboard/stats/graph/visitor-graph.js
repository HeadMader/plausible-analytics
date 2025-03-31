/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import * as api from '../../api'
import * as storage from '../../util/storage'
import TopStats from './top-stats'
import { IntervalPicker, getCurrentInterval } from './interval-picker'
import StatsExport from './stats-export'
import WithImportedSwitch from './with-imported-switch'
import SamplingNotice from './sampling-notice'
import FadeIn from '../../fade-in'
import * as url from '../../util/url'
import { isComparisonEnabled } from '../../query-time-periods'
import LineGraphWithRouter from './line-graph'
import { useQueryContext } from '../../query-context'
import { useSiteContext } from '../../site-context'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { Tooltip } from '../../util/tooltip'

function fetchTopStats(site, query) {
  const q = { ...query }

  if (!isComparisonEnabled(q.comparison) && query.period !== 'realtime') {
    q.comparison = 'previous_period'
  }

  return api.get(url.apiPath(site, '/top-stats'), q)
}

function fetchMainGraph(site, query, metric, interval) {
  const params = { metric, interval }
  return api.get(url.apiPath(site, '/main-graph'), query, params)
}

export default function VisitorGraph({ updateImportedDataInView }) {
  const { query } = useQueryContext()
  const site = useSiteContext()

  const isRealtime = query.period === 'realtime'
  const isDarkTheme =
    document.querySelector('html').classList.contains('dark') || false

  const topStatsBoundary = useRef(null)

  const [topStatData, setTopStatData] = useState(null)
  const [topStatsLoading, setTopStatsLoading] = useState(true)
  const [graphData, setGraphData] = useState(null)
  const [graphLoading, setGraphLoading] = useState(true)
  const [showGraph, setShowGraph] = useState(true)

  // This state is explicitly meant for the situation where either graph interval
  // or graph metric is changed. That results in behaviour where Top Stats stay
  // intact, but the graph container alone will display a loading spinner for as
  // long as new graph data is fetched.
  const [graphRefreshing, setGraphRefreshing] = useState(false)

  const onIntervalUpdate = useCallback(
    (newInterval) => {
      setGraphData(null)
      setGraphRefreshing(true)
      fetchGraphData(getStoredMetric(), newInterval)
    },
    [query]
  )

  const onMetricUpdate = useCallback(
    (newMetric) => {
      setGraphData(null)
      setGraphRefreshing(true)
      fetchGraphData(newMetric, getCurrentInterval(site, query))
    },
    [query]
  )

  useEffect(() => {
    setTopStatData(null)
    setTopStatsLoading(true)
    setGraphData(null)
    setGraphLoading(true)
    fetchTopStatsAndGraphData()

    if (isRealtime) {
      document.addEventListener('tick', fetchTopStatsAndGraphData)
    }

    return () => {
      document.removeEventListener('tick', fetchTopStatsAndGraphData)
    }
  }, [query])

  useEffect(() => {
    if (topStatData) {
      storeTopStatsContainerHeight()
    }
  }, [topStatData])

  async function fetchTopStatsAndGraphData() {
    const response = await fetchTopStats(site, query)

    let metric = getStoredMetric()
    const availableMetrics = response.graphable_metrics

    if (!availableMetrics.includes(metric)) {
      metric = availableMetrics[0]
      storage.setItem(`metric__${site.domain}`, metric)
    }

    const interval = getCurrentInterval(site, query)

    if (response.updateImportedDataInView) {
      updateImportedDataInView(response.includes_imported)
    }

    setTopStatData(response)
    setTopStatsLoading(false)

    fetchGraphData(metric, interval)
  }

  function fetchGraphData(metric, interval) {
    fetchMainGraph(site, query, metric, interval).then((res) => {
      setGraphData(res)
      setGraphLoading(false)
      setGraphRefreshing(false)
    })
  }

  function getStoredMetric() {
    return storage.getItem(`metric__${site.domain}`)
  }

  function storeTopStatsContainerHeight() {
    storage.setItem(
      `topStatsHeight__${site.domain}`,
      document.getElementById('top-stats-container').clientHeight
    )
  }

  // This function is used for maintaining the main-graph/top-stats container height in the
  // loading process. The container height depends on how many top stat metrics are returned
  // from the API, but in the loading state, we don't know that yet. We can use localStorage
  // to keep track of the Top Stats container height.
  function getTopStatsHeight() {
    if (topStatData) {
      return 'auto'
    } else {
      return `${storage.getItem(`topStatsHeight__${site.domain}`) || 89}px`
    }
  }

  function importedSwitchVisible() {
    return (
      !!topStatData?.with_imported_switch &&
      topStatData?.with_imported_switch.visible
    )
  }

  function renderImportedIntervalUnsupportedWarning() {
    const unsupportedInterval = ['hour', 'minute'].includes(
      getCurrentInterval(site, query)
    )
    const showingImported =
      importedSwitchVisible() && query.with_imported === true

    return (
      <FadeIn
        show={showingImported && unsupportedInterval}
        className="h-6 mr-1"
      >
        <span tooltip={'Interval is too short to graph imported data'}>
          <ExclamationCircleIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </span>
      </FadeIn>
    )
  }

  return (
    <div
      className={
        'relative w-full mt-2 bg-white rounded shadow-xl dark:bg-gray-825'
      }
    >
      {(topStatsLoading || graphLoading) && renderLoader()}
      <FadeIn show={!(topStatsLoading || graphLoading)}>
        <div className="flex justify-end p-2 absolute top-0 right-0 z-9">
          <Tooltip info={<div>
                      <p className="whitespace-nowrap text-small">
                       {showGraph ? 'Hide Graph' : 'Show Graph'}
                      </p>
                    </div>}>
            <button
              className="text-sm px-3 py-1 border rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              onClick={() => setShowGraph((prev) => !prev)}
            >
              {showGraph ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#e8eaed"
                >
                  <path d="M73-889 889-73l-57 57-104-104H200q-33 0-56.5-23.5T120-200v-528L16-832l57-57Zm287 447L200-282v82h448L544-304l-22 24-162-162ZM200-648v252l126-126-126-126Zm36-192h524q33 0 56.5 23.5T840-760v524l-80-80v-234L650-426l-57-57 167-187v-90H316l-80-80Zm357 357Zm-158 70ZM326-522Zm34 80Zm176-98Z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#e8eaed"
                >
                  <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-162v82h560v-350L522-280 360-442 200-282Zm0-114 160-160 158 158 242-272v-90H200v364Zm0-154v-120 272-158 274-160 162-270Zm0 154v-364 362-158 160Zm0 114v-160 162-270 350-82Z" />
                </svg>
              )}
            </button>
          </Tooltip>
        </div>
        <div
          id="top-stats-container"
          className="flex flex-wrap"
          ref={topStatsBoundary}
          style={{ height: getTopStatsHeight() }}
        >
          <TopStats
            graphableMetrics={topStatData?.graphable_metrics || []}
            data={topStatData}
            onMetricUpdate={onMetricUpdate}
            tooltipBoundary={topStatsBoundary.current}
          />
        </div>
        {showGraph && (
          <div className="relative px-2">
            {graphRefreshing && renderLoader()}
            <div className="absolute right-4 -top-8 py-1 flex items-center">
              {renderImportedIntervalUnsupportedWarning()}
              {!isRealtime && <StatsExport />}
              <SamplingNotice samplePercent={topStatData} />
              {importedSwitchVisible() && (
                <WithImportedSwitch
                  tooltipMessage={topStatData.with_imported_switch.tooltip_msg}
                  disabled={!topStatData.with_imported_switch.togglable}
                />
              )}
              <IntervalPicker onIntervalUpdate={onIntervalUpdate} />
            </div>
            <LineGraphWithRouter
              graphData={{
                ...graphData,
                interval: getCurrentInterval(site, query)
              }}
              darkTheme={isDarkTheme}
            />
          </div>
        )}
      </FadeIn>
    </div>
  )
}

function renderLoader() {
  return (
    <div className="absolute h-full w-full flex items-center justify-center">
      <div className="loading">
        <div></div>
      </div>
    </div>
  )
}
