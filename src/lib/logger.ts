/**
 * Log level enumeration for controlling output verbosity.
 */
export enum LogLevel {
  /** Only critical errors */
  ERROR = 0,
  /** Warnings and errors */
  WARN = 1,
  /** General information, warnings, and errors */
  INFO = 2,
  /** Detailed debugging information */
  DEBUG = 3,
  /** Extremely detailed trace information */
  TRACE = 4
}

/**
 * Configuration options for the Logger class.
 */
export interface LoggerConfig {
  /** Current log level - messages below this level will be ignored */
  level?: LogLevel;
  /** Whether to include timestamps in log output */
  showTimestamps?: boolean;
  /** Whether to include the logger context/name in output */
  showContext?: boolean;
  /** Whether to colorize output (default: true) */
  colorize?: boolean;
  /** Whether to show detailed object inspection */
  detailed?: boolean;
  /** Maximum depth for object inspection */
  maxDepth?: number;
  /** Whether to compact object output */
  compact?: boolean;
  /** Custom prefix for all log messages */
  prefix?: string;
}

export const emojis = {
  RightArrow: "→",
  LeftArrow: "←",
  UpArrow: "↑",
  DownArrow: "↓",
  Checkmark: "✓",
  Crossmark: "✗",
  Warning: "⚠️",
  Info: "ℹ️",
  Debug: "🐛",
  Trace: "🔍",
  Error: "🚨",
  Question: "❓",
  Exclamation: "❗",
  Bullet: "•",
  Star: "★",
  Heart: "❤️",
  Clock: "⏰",
  Trash: "🗑️"
};

type Part = {
  text: string;
  emoji?: string;
  color?: string;
};

/**
 * Color scheme configuration for different log levels.
 */
interface ColorScheme {
  dim: string;
  error: string;
  warn: string;
  info: string;
  debug: string;
  trace: string;
  timestamp: string;
  context: string;
  label: string;
  key: string;
  value: string;
  number: string;
  string: string;
  boolean: string;
  null: string;
  undefined: string;
  function: string;
  symbol: string;
}

/**
 * Default color scheme with beautiful, high-contrast colors.
 */
const DEFAULT_COLORS: ColorScheme = {
  dim: "color: #90a4ae; font-size: 0.9em;",
  error: "color: #ff6b6b; font-weight: bold;",
  warn: "color: #ffa726; font-weight: bold;",
  info: "color: #42a5f5; font-weight: bold;",
  debug: "color: #66bb6a; font-weight: bold;",
  trace: "color:rgb(194, 223, 109);",
  timestamp: "color: #90a4ae; font-size: 0.9em;",
  context: "color: #5c6bc0; font-weight: bold;",
  label: "color:rgb(218, 38, 197); font-weight: bold;",
  key: "color: #26c6da; font-weight: bold;",
  value: "color: #ffee58;",
  number: "color: #ff7043;",
  string: "color: #9ccc65;",
  boolean: "color: #ec407a;",
  null: "color: #78909c; font-style: italic;",
  undefined: "color: #78909c; font-style: italic;",
  function: "color: #ffa726; font-style: italic;",
  symbol: "color: #ab47bc; font-style: italic;"
};

/**
 * Universal Logger class with beautiful coloring and comprehensive debugging features.
 *
 * Provides structured logging with multiple levels, colorized output, and advanced
 * object inspection capabilities. Perfect for debugging complex applications.
 *
 * @example
 * ```ts
 * // Create a logger instance
 * const logger = new Logger('MyComponent', { level: LogLevel.DEBUG });
 *
 * // Simple logging
 * logger.info('Application started');
 * logger.error('Something went wrong!');
 *
 * // Object inspection
 * logger.debug('User data:', { id: 123, name: 'John', settings: { theme: 'dark' } });
 *
 * // Advanced formatting
 * logger.trace('Function called', { args: [1, 2, 3], result: 'success' });
 * ```
 */
export class Logger {
  private config: LoggerConfig;
  private colors: ColorScheme;
  private context: string;

  /**
   * Creates a new Logger instance.
   *
   * @param context - Name or identifier for this logger instance
   * @param config - Configuration options for the logger
   */
  constructor(context: string = "Logger", config: LoggerConfig = {}) {
    this.context = context;
    this.config = {
      level: config.level ?? LogLevel.INFO,
      showTimestamps: config.showTimestamps,
      showContext: config.showContext ?? true,
      colorize: config.colorize ?? true,
      detailed: config.detailed ?? true,
      maxDepth: config.maxDepth ?? 3,
      compact: config.compact ?? false,
      prefix: config.prefix ?? ""
    };
    this.colors = DEFAULT_COLORS;
  }

  /**
   * Updates the logger configuration.
   *
   * @param config - Partial configuration to merge with existing settings
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Sets the current log level.
   *
   * @param level - New log level to set
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Gets the current log level.
   */
  getLevel(): LogLevel {
    return this.config.level ?? LogLevel.INFO;
  }

  /**
   * Logs an error message with optional data.
   *
   * @param message - Primary error message
   * @param data - Optional additional data to log
   */
  error(label: string, message: string, ...data: unknown[]): void {
    this._log(LogLevel.ERROR, label, message, ...data);
  }

  /**
   * Logs a warning message with optional data.
   *
   * @param message - Primary warning message
   * @param data - Optional additional data to log
   */
  warn(label: string, message: string, ...data: unknown[]): void {
    this._log(LogLevel.WARN, label, message, ...data);
  }

  /**
   * Logs an informational message with optional data.
   *
   * @param message - Primary information message
   * @param data - Optional additional data to log
   */
  info(label: string, message: string, ...data: unknown[]): void {
    this._log(LogLevel.INFO, label, message, ...data);
  }

  /**
   * Logs a debug message with optional data.
   *
   * @param message - Primary debug message
   * @param data - Optional additional data to log
   */
  debug(label: string, message: string, ...data: unknown[]): void {
    this._log(LogLevel.DEBUG, label, message, ...data);
  }

  /**
   * Logs a trace message with optional data.
   *
   * @param message - Primary trace message
   * @param data - Optional additional data to log
   */
  trace(label: string, message: string, ...data: unknown[]): void {
    this._log(LogLevel.TRACE, label, message, ...data);
  }

  /**
   * Logs an object with detailed inspection, similar to Node.js util.inspect.
   *
   * @param obj - Object to inspect and log
   * @param options - Inspection options
   */
  inspect(
    obj: unknown,
    options: { colorize?: boolean; compact?: boolean; maxDepth?: number } = {}
  ): void {
    const inspectOptions = {
      colorize: options.colorize ?? this.config.colorize ?? true,
      compact: options.compact ?? this.config.compact ?? false,
      maxDepth: options.maxDepth ?? this.config.maxDepth ?? 3
    };

    if (this.getLevel() < LogLevel.DEBUG) return;

    const inspected = this._inspect(obj, inspectOptions);

    if (inspectOptions.colorize && this.config.colorize) {
      console.log(
        `%c🔍 %c[${this.context}]%c ${this._getTimestamp()}%c\n${inspected}`,
        this.colors.debug,
        this.colors.context,
        this.colors.timestamp,
        "color: inherit;"
      );
    } else {
      console.log(`🔍 [${this.context}] ${this._getTimestamp()}\n${inspected}`);
    }
  }

  /**
   * Creates a timer for measuring execution time.
   *
   * @param label - Label for the timer
   */
  time(label: string): void {
    if (this.getLevel() >= LogLevel.DEBUG) {
      console.time(`[${this.context}] ${label}`);
    }
  }

  /**
   * Ends a timer and logs the elapsed time.
   *
   * @param label - Label for the timer to end
   */
  timeEnd(label: string): void {
    if (this.getLevel() >= LogLevel.DEBUG) {
      console.timeEnd(`[${this.context}] ${label}`);
    }
  }

  /**
   * Logs the current stack trace.
   *
   * @param message - Optional message to include with the stack trace
   */
  stack(message?: string): void {
    if (this.getLevel() >= LogLevel.DEBUG) {
      const msg = message ? `${message} - Stack trace:` : "Stack trace:";
      this.debug("stack", msg);
      console.trace();
    }
  }

  /**
   * Groups related log messages together.
   *
   * @param label - Label for the group
   * @param collapsed - Whether the group should start collapsed
   */
  group(label: string, collapsed: boolean = false): void {
    if (this.getLevel() >= LogLevel.DEBUG) {
      if (collapsed) {
        console.groupCollapsed(`[${this.context}] ${label}`);
      } else {
        console.group(`[${this.context}] ${label}`);
      }
    }
  }

  /**
   * Ends the current log group.
   */
  groupEnd(): void {
    if (this.getLevel() >= LogLevel.DEBUG) {
      console.groupEnd();
    }
  }

  /**
   * Logs a table representation of data.
   *
   * @param data - Data to display in table format
   * @param columns - Optional column names to display
   */
  table(data: unknown, columns?: string[]): void {
    if (this.getLevel() >= LogLevel.DEBUG) {
      this.debug("table", "Table data:");
      console.table(data, columns);
    }
  }

  /**
   * Creates a child logger with the same configuration but different context.
   *
   * @param context - Context name for the child logger
   */
  child(context: string): Logger {
    return new Logger(`${this.context}:${context}`, this.config);
  }

  /**
   * Core logging method that handles message formatting and output.
   */

  private _log(level: LogLevel, label: string, message: string, ...data: unknown[]): void {
    if (level > this.getLevel()) return;

    const levelName = LogLevel[level].toLowerCase();
    const emoji = this._getLevelEmoji(level);
    const timestamp = this._getTimestamp();

    let formattedMessage = "";
    let styles: string[] = [];

    if (this.config.colorize) {
      formattedMessage = `${emoji} %c`;
      styles.push(this._getLevelColor(level));

      if (this.config.showContext) {
        formattedMessage += `[${this.context}]%c `;
        styles.push(this.colors.context);
      }

      if (this.config.showTimestamps) {
        formattedMessage += `${timestamp}%c `;
        styles.push(this.colors.timestamp);
      }

      if (label) {
        formattedMessage += `%c${label}: `;
        styles.push(this.colors.label);
      }

      if (this.config.prefix) {
        formattedMessage += `${this.config.prefix} `;
      }

      formattedMessage += `%c${message}`;
      styles.push("color: inherit; font-weight: normal;");
    } else {
      // Plain text formatting
      let parts = [emoji];

      if (this.config.showContext) {
        parts.push(`[${this.context}]`);
      }

      if (this.config.showTimestamps) {
        parts.push(timestamp);
      }

      if (this.config.prefix) {
        parts.push(this.config.prefix);
      }

      parts.push(message);
      formattedMessage = parts.join(" ");
    }

    // Output the message
    if (data.length > 0) {
      if (this.config.colorize && styles.length > 0) {
        console.log(formattedMessage, ...styles);
        this._logData(data);
      } else {
        console.log(formattedMessage);
        this._logData(data);
      }
    } else {
      if (this.config.colorize && styles.length > 0) {
        console.log(formattedMessage, ...styles);
      } else {
        console.log(formattedMessage);
      }
    }
  }

  /**
   * Logs additional data with proper formatting.
   */
  private _logData(data: unknown[]): void {
    for (const item of data) {
      if (this.config.detailed && typeof item === "object" && item !== null) {
        const inspected = this._inspect(item, {
          colorize: this.config.colorize ?? true,
          compact: this.config.compact ?? false,
          maxDepth: this.config.maxDepth ?? 3
        });
        const error = this.getError(item as DOMException);
        console.log(error.string, ...error.styles);
        console.log(`${item}\n\n${error.string}`, ...error.styles);
      } else {
        console.log(item);
      }
    }
  }

  private getError(e: DOMException): { string: string; styles: string[] } {
    return {
      string: `%cException:\nname: %c${e.name}%c\nmessage: %c${flatten(e.message)}%c\nstack:\n%c${e.stack}%c`,
      styles: [
        this.colors.dim,
        this.colors.error,
        this.colors.dim,
        this.colors.warn,
        this.colors.dim,
        this.colors.trace
      ]
    };
  }

  /**
   * Browser-compatible object inspection similar to Node.js util.inspect.
   */
  private _inspect(
    obj: unknown,
    options: { colorize: boolean; compact: boolean; maxDepth: number },
    currentDepth: number = 0
  ): string {
    if (currentDepth >= options.maxDepth) {
      return options.colorize ? `%c[Object]` : "[Object]";
    }

    if (obj === null) {
      return options.colorize ? `%cnull` : "null";
    }

    if (obj === undefined) {
      return options.colorize ? `%cundefined` : "undefined";
    }

    const type = typeof obj;

    switch (type) {
      case "string":
        const escaped = JSON.stringify(obj);
        return options.colorize ? `%c${escaped}` : escaped;

      case "number":
      case "bigint":
        return options.colorize ? `%c${obj}` : String(obj);

      case "boolean":
        return options.colorize ? `%c${obj}` : String(obj);

      case "function":
        const funcName = (obj as Function).constructor?.name || "Function";
        return options.colorize
          ? `%c[${funcName}: ${(obj as Function).name || "anonymous"}]`
          : `[${funcName}: ${(obj as Function).name || "anonymous"}]`;

      case "symbol":
        return options.colorize ? `%c${obj.toString()}` : obj.toString();

      case "object":
        if (Array.isArray(obj)) {
          return this._inspectArray(obj, options, currentDepth);
        } else {
          return this._inspectObject(obj as Record<string, unknown>, options, currentDepth);
        }

      default:
        return options.colorize ? `%c${String(obj)}` : String(obj);
    }
  }

  /**
   * Inspects arrays with proper formatting.
   */
  private _inspectArray(
    arr: unknown[],
    options: { colorize: boolean; compact: boolean; maxDepth: number },
    currentDepth: number
  ): string {
    if (arr.length === 0) {
      return "[]";
    }

    const items = arr.slice(0, 10).map((item) => this._inspect(item, options, currentDepth + 1));

    if (arr.length > 10) {
      items.push(
        options.colorize
          ? `%c... ${arr.length - 10} more items`
          : `... ${arr.length - 10} more items`
      );
    }

    if (options.compact) {
      return `[ ${items.join(", ")} ]`;
    } else {
      const indent = "  ".repeat(currentDepth + 1);
      const closeIndent = "  ".repeat(currentDepth);
      return `[\n${indent}${items.join(`,\n${indent}`)}\n${closeIndent}]`;
    }
  }

  /**
   * Inspects objects with proper formatting.
   */
  private _inspectObject(
    obj: Record<string, unknown>,
    options: { colorize: boolean; compact: boolean; maxDepth: number },
    currentDepth: number
  ): string {
    const keys = Object.keys(obj);

    if (keys.length === 0) {
      return "{}";
    }

    const pairs = keys.slice(0, 10).map((key) => {
      const value = this._inspect(obj[key], options, currentDepth + 1);
      const keyStr = options.colorize ? `%c${key}%c: ` : `${key}: `;
      return keyStr + value;
    });

    if (keys.length > 10) {
      pairs.push(
        options.colorize
          ? `%c... ${keys.length - 10} more properties`
          : `... ${keys.length - 10} more properties`
      );
    }

    if (options.compact) {
      return `{ ${pairs.join(", ")} }`;
    } else {
      const indent = "  ".repeat(currentDepth + 1);
      const closeIndent = "  ".repeat(currentDepth);
      return `{\n${indent}${pairs.join(`,\n${indent}`)}\n${closeIndent}}`;
    }
  }

  /**
   * Gets the appropriate emoji for each log level.
   */
  private _getLevelEmoji(level: LogLevel): string {
    const emojis = {
      [LogLevel.ERROR]: "🚨",
      [LogLevel.WARN]: "⚠️",
      [LogLevel.INFO]: "ℹ️",
      [LogLevel.DEBUG]: "🐛",
      [LogLevel.TRACE]: "🔍"
    };
    return emojis[level] || "ℹ️";
  }

  /**
   * Gets the appropriate color for each log level.
   */
  private _getLevelColor(level: LogLevel): string {
    const colors = {
      [LogLevel.ERROR]: this.colors.error,
      [LogLevel.WARN]: this.colors.warn,
      [LogLevel.INFO]: this.colors.info,
      [LogLevel.DEBUG]: this.colors.debug,
      [LogLevel.TRACE]: this.colors.trace
    };
    return colors[level] || this.colors.info;
  }

  /**
   * Generates a formatted timestamp string.
   */
  private _getTimestamp(): string {
    if (!this.config.showTimestamps) return "";

    const now = new Date();
    const time = now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    const ms = String(now.getMilliseconds()).padStart(3, "0");
    return `${time}.${ms}`;
  }
}

/**
 * Default logger instance for quick usage.
 */
export const logger = new Logger("App");

/**
 * Creates a new logger instance with the specified context.
 *
 * @param context - Context name for the logger
 * @param config - Optional configuration for the logger
 */
export function createLogger(context: string, config?: LoggerConfig): Logger {
  return new Logger(context, config);
}

/**
 * Sets the global log level for all new logger instances.
 *
 * @param level - Log level to set globally
 */
export function setGlobalLogLevel(level: LogLevel): void {
  logger.setLevel(level);
}

/**
 * Quick logging functions for convenience.
 */
export const log = {
  error: (label: string, message: string, ...data: unknown[]) =>
    logger.error(label, message, ...data),
  warn: (label: string, message: string, ...data: unknown[]) =>
    logger.warn(label, message, ...data),
  info: (label: string, message: string, ...data: unknown[]) =>
    logger.info(label, message, ...data),
  debug: (label: string, message: string, ...data: unknown[]) =>
    logger.debug(label, message, ...data),
  trace: (label: string, message: string, ...data: unknown[]) =>
    logger.trace(label, message, ...data),
  inspect: (obj: unknown, options?: Parameters<Logger["inspect"]>[1]) =>
    logger.inspect(obj, options)
};

const flatten = (message: string): string => {
  return (message || "").replace(/\s+|\n+|\t+/g, " ").trim();
};
