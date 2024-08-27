export type Proxy = {
  protocol: any;
  host: string
  port: number
}

export type DownloadedFile = {
  path: string
  url: string
}

export type UserInput = {
  query: string
  fileType: string
  maxResults: number
}
