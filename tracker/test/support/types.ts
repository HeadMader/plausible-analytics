export type Options = {
  hashBasedRouting: boolean
  outboundLinks: boolean
  fileDownloads: boolean | string[]
  formSubmissions: boolean
  captureOnLocalhost: boolean
  autoCapturePageviews: boolean
}

export type ScriptConfig = {
  domain: string
  endpoint: string
} & Partial<Options>
