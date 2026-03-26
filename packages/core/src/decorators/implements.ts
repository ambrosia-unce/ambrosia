/**
 * @Implements decorator
 *
 * Maps an abstract class to a concrete implementation.
 * Allows injecting abstract classes as if they were interfaces.
 *
 * @example
 * ```TypeScript
 * abstract class PaymentGateway {
 *   abstract processPayment(amount: number): Promise<void>;
 * }
 *
 * @Implements(PaymentGateway)
 * @Injectable()
 * class StripeGateway extends PaymentGateway {
 *   async processPayment(amount: number) {
 *     // Stripe implementation
 *   }
 * }
 *
 * @Injectable()
 * class CheckoutService {
 *   constructor(private gateway: PaymentGateway) {}
 *   // StripeGateway will be injected
 * }
 * ```
 */

import { getRegistry } from "../container";
import { MetadataManager } from "../metadata";
import type { Abstract, Constructor, ImplementsMetadata } from "../types";

/**
 * @Implements() decorator
 *
 * Marks a class as the implementation of an abstract class.
 * When the abstract class is requested as a dependency, this implementation will be injected.
 *
 * @param abstractToken The abstract class this class implements
 * @returns Class decorator
 *
 * @example
 * Basic usage:
 * ```TypeScript
 * abstract class Logger {
 *   abstract log(message: string): void;
 *   abstract error(message: string): void;
 * }
 *
 * @Implements(Logger)
 * @Injectable()
 * class ConsoleLogger extends Logger {
 *   log(message: string) {
 *     console.log(message);
 *   }
 *   error(message: string) {
 *     console.error(message);
 *   }
 * }
 *
 * @Injectable()
 * class AppService {
 *   constructor(private logger: Logger) {}
 *   // ConsoleLogger will be injected
 * }
 * ```
 *
 * @example
 * Multiple implementations (manual selection):
 * ```TypeScript
 * abstract class Storage {
 *   abstract save(key: string, value: any): void;
 *   abstract load(key: string): any;
 * }
 *
 * @Implements(Storage)
 * @Injectable()
 * class LocalStorage extends Storage {
 *   save(key: string, value: any) { localStorage.setItem(key, JSON.stringify(value)); }
 *   load(key: string) { return JSON.parse(localStorage.getItem(key) || 'null'); }
 * }
 *
 * @Implements(Storage)
 * @Injectable()
 * class SessionStorage extends Storage {
 *   save(key: string, value: any) { sessionStorage.setItem(key, JSON.stringify(value)); }
 *   load(key: string) { return JSON.parse(sessionStorage.getItem(key) || 'null'); }
 * }
 *
 * // Manual selection via explicit injection
 * @Injectable()
 * class UserService {
 *   constructor(@Inject(LocalStorage) private storage: Storage) {}
 * }
 * ```
 *
 * @example
 * Interface-like behavior:
 * ```TypeScript
 * // Abstract class used as interface
 * abstract class IEmailService {
 *   abstract send(to: string, subject: string, body: string): Promise<void>;
 * }
 *
 * @Implements(IEmailService)
 * @Injectable()
 * class SmtpEmailService extends IEmailService {
 *   async send(to: string, subject: string, body: string) {
 *     // SMTP implementation
 *   }
 * }
 *
 * @Injectable()
 * class NotificationService {
 *   constructor(private emailService: IEmailService) {}
 *   // SmtpEmailService will be injected
 * }
 * ```
 */
export function Implements(abstractToken: Abstract<any>): ClassDecorator {
  return <T extends Function>(target: T): T => {
    const constructor = target as unknown as Constructor;

    // Store metadata on the class
    const metadata: ImplementsMetadata = {
      abstractToken,
    };
    MetadataManager.setImplements(constructor, metadata);

    // Register the abstract -> concrete mapping in the global Registry
    const registry = getRegistry();
    registry.registerImplementation(abstractToken, constructor);

    return target;
  };
}
