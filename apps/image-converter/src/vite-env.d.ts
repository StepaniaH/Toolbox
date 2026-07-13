/// <reference types="vite/client" />

interface HTMLInputElement {
  webkitdirectory: boolean;
}

interface File {
  readonly webkitRelativePath: string;
}
