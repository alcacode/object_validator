declare module 'object_validator' {
        export interface TestConfigItem {
                /**
                 * Concise label describing what is being tested. Values
                 * longer than 48 characters are trimmed.
                 */
                label?: string;

                /**
                 * Description of test shown when a test result is expanded.
                 */
                description?: string;

                /**
                 * Value of property being tested to provide during testing.
                 * If not set, input will be an object literal with no
                 * properties.
                 * 
                 * ```JavaScript
                 * { [propertyKey]: arg }
                 * ```
                 */
                arg?: any;

                /**
                 * Expected output. Defaults to value of `arg` if not
                 * set.
                 */
                expect?: any;

                /** Option rule to apply. */
                decl: OptionRule;

                /** If `true`, expect test to fail. */
                shouldFail?: boolean;

                /** If `true`, expect test to throw an exception. */
                shouldThrow?: boolean;

                /** Override the default property key with this. */
                propKey?: PropertyKey;
        }

        export interface TestConfig {
                [key: string]: TestConfigItem;
        }
}