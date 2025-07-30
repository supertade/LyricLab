declare module '@capacitor-community/safe-area' {
  export interface SafeAreaPlugin {
    enable(options: { config: SafeAreaConfig }): Promise<void>;
    disable(options: { config: SafeAreaConfig }): Promise<void>;
  }

  export interface SafeAreaConfig {
    customColorsForSystemBars?: boolean;
    statusBarColor?: string;
    statusBarContent?: 'light' | 'dark';
    navigationBarColor?: string;
    navigationBarContent?: 'light' | 'dark';
    offset?: number;
  }

  export const SafeArea: SafeAreaPlugin;
}

declare module '@capacitor/status-bar' {
  export interface StatusBarPlugin {
    setOverlaysWebView(options: { overlay: boolean }): Promise<void>;
    setBackgroundColor(options: { color: string }): Promise<void>;
    setStyle(options: { style: 'light' | 'dark' }): Promise<void>;
    show(): Promise<void>;
    hide(): Promise<void>;
  }

  export const StatusBar: StatusBarPlugin;
} 