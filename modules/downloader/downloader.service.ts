import { DownloadedFile } from '../../types/common.types'

export interface IDownloaderService {
  downloadFile(
    url: string,
    fileType: string,
    downloadFolder: string,
  ): Promise<DownloadedFile | null>
}
